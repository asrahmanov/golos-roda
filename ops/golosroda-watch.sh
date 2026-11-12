#!/bin/sh
# Cron watcher for голосрода.рф: once the A records point here, issue SSL
# and make the new domain the site's primary URL. Removes itself when done.
PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
IP="194.87.86.15"
APEX="xn--80afd1aobapi.xn--p1ai"
WWW="www.$APEX"
PROJ="/root/projects/svyaz-pokoleny"
STATE="/root/golosroda-state"
LOG="$STATE/watch.log"
NPM="nginx-proxy-manager"
mkdir -p "$STATE"
exec 9>"$STATE/lock"
flock -n 9 || exit 0

log() { echo "$(date '+%F %T') $*" >> "$LOG"; }

points_here() {
  ips=$(curl -s --max-time 10 "https://dns.google/resolve?name=$1&type=A" | grep -o '"data":"[0-9.]*"' | grep -o '[0-9.]*[0-9]')
  [ -n "$ips" ] && [ "$(echo "$ips" | grep -vc "^$IP$")" = 0 ]
}

# Let's Encrypt allows few failed validations per hour — back off 30 min after a failure.
if [ -f "$STATE/fail" ] && [ $(( $(date +%s) - $(cat "$STATE/fail") )) -lt 1800 ]; then exit 0; fi

issue() {
  docker cp "$PROJ/ops/npm-golosroda.sh" "$NPM:/tmp/npm-golosroda.sh" >/dev/null
  out=$(docker exec --env-file "$STATE/npm.env" "$NPM" sh /tmp/npm-golosroda.sh ssl "$@" 2>&1)
  log "issue $*: $out"
  if echo "$out" | grep -q "SSL OK"; then rm -f "$STATE/fail"; return 0; fi
  date +%s > "$STATE/fail"; return 1
}

points_here "$APEX" || exit 0
www_ok=0; points_here "$WWW" && www_ok=1

if [ ! -f "$STATE/ssl" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "http://$APEX/")
  [ "$code" = 200 ] || [ "$code" = 301 ] || [ "$code" = 308 ] || { log "dns ok but http=$code, waiting"; exit 0; }
  if [ $www_ok = 1 ]; then issue "$APEX" "$WWW" && { touch "$STATE/ssl" "$STATE/ssl_www"; }
  else issue "$APEX" && touch "$STATE/ssl"; fi
  [ -f "$STATE/ssl" ] || exit 0
elif [ $www_ok = 1 ] && [ ! -f "$STATE/ssl_www" ]; then
  issue "$APEX" "$WWW" && touch "$STATE/ssl_www"
fi

if [ ! -f "$STATE/switched" ]; then
  code=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 "https://$APEX/")
  [ "$code" = 200 ] || { log "https=$code, not switching yet"; exit 0; }
  cd "$PROJ" || exit 1
  sed -i "s|^SITE_URL=.*|SITE_URL=https://$APEX|" .env
  log "rebuilding app with SITE_URL=https://$APEX"
  if docker compose -f docker-compose.prod.yml --env-file .env build svyaz_app >> "$LOG" 2>&1 \
     && docker compose -f docker-compose.prod.yml --env-file .env up -d svyaz_app >> "$LOG" 2>&1; then
    touch "$STATE/switched"; log "switched to https://$APEX"
  else
    log "rebuild FAILED"; date +%s > "$STATE/fail"
  fi
fi

if [ -f "$STATE/switched" ] && [ -f "$STATE/ssl_www" ]; then
  crontab -l 2>/dev/null | grep -v golosroda-watch | crontab -
  log "all done, cron removed"
fi
