#!/bin/sh
# Runs INSIDE the nginx-proxy-manager container.
# Usage: npm-golosroda.sh host            — create HTTP proxy host (idempotent)
#        npm-golosroda.sh ssl d1 [d2...]  — issue LE cert for the domains and enable HTTPS
API="http://127.0.0.1:81/api"
IDENT="${NPM_IDENTITY:?set NPM_IDENTITY (Nginx Proxy Manager login)}"
SECRET="${NPM_SECRET:?set NPM_SECRET (Nginx Proxy Manager password)}"
APEX="xn--80afd1aobapi.xn--p1ai"
WWW="www.$APEX"

TOKEN=$(curl -s -X POST "$API/tokens" -H "Content-Type: application/json" \
  -d "{\"identity\":\"$IDENT\",\"secret\":\"$SECRET\"}" | sed 's/.*"token":"//;s/".*//')
[ -z "$TOKEN" ] && { echo "LOGIN FAILED"; exit 1; }
AUTH="Authorization: Bearer $TOKEN"

PHID=$(curl -s "$API/nginx/proxy-hosts" -H "$AUTH" | tr '}' '\n' | grep "\"$APEX\"" \
  | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')

if [ "$1" = "host" ]; then
  if [ -n "$PHID" ]; then echo "proxy host exists id=$PHID"; exit 0; fi
  RESP=$(curl -s -X POST "$API/nginx/proxy-hosts" -H "$AUTH" -H "Content-Type: application/json" -d "{
    \"domain_names\":[\"$APEX\",\"$WWW\"],
    \"forward_scheme\":\"http\",
    \"forward_host\":\"svyaz_app\",
    \"forward_port\":3000,
    \"caching_enabled\":false,
    \"block_exploits\":true,
    \"allow_websocket_upgrade\":true,
    \"access_list_id\":0,
    \"certificate_id\":0,
    \"ssl_forced\":false,
    \"http2_support\":false,
    \"hsts_enabled\":false,
    \"hsts_subdomains\":false,
    \"meta\":{\"letsencrypt_agree\":false,\"dns_challenge\":false},
    \"advanced_config\":\"client_max_body_size 210m; proxy_request_buffering off; proxy_read_timeout 3600s; proxy_send_timeout 3600s;\",
    \"locations\":[]
  }")
  echo "created: $(echo "$RESP" | head -c 300)"
  exit 0
fi

[ "$1" = "ssl" ] || { echo "unknown command"; exit 1; }
shift
[ -z "$PHID" ] && { echo "NO PROXY HOST"; exit 1; }
DOMS=$(printf '"%s",' "$@" | sed 's/,$//')
CRESP=$(curl -s -X POST "$API/nginx/certificates" -H "$AUTH" -H "Content-Type: application/json" -d "{
  \"provider\":\"letsencrypt\",
  \"nice_name\":\"$APEX\",
  \"domain_names\":[$DOMS],
  \"meta\":{\"dns_challenge\":false}
}")
CID=$(echo "$CRESP" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "cert resp: $(echo "$CRESP" | head -c 400)"
[ -z "$CID" ] && { echo "CERT FAILED"; exit 1; }

URESP=$(curl -s -X PUT "$API/nginx/proxy-hosts/$PHID" -H "$AUTH" -H "Content-Type: application/json" -d "{
  \"certificate_id\":$CID,
  \"ssl_forced\":true,
  \"http2_support\":true,
  \"hsts_enabled\":true,
  \"hsts_subdomains\":false
}")
echo "update: $(echo "$URESP" | head -c 200)"
echo "SSL OK PHID=$PHID CID=$CID"
