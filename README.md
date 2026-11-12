# Голос рода

Платформа общественного проекта «Голос рода» — [голосрода.рф](https://голосрода.рф): публичный сайт, личный кабинет семьи (семейное древо, архив фото, аудио, видео и документов, приглашения родственников) и админ-панель.

## Стек

- Next.js 15 (App Router, standalone-сборка), React 19, TypeScript, Tailwind CSS 4, framer-motion
- PostgreSQL 16 + Prisma 6
- Авторизация: JWT в httpOnly-cookie (jose, bcryptjs), подтверждение почты и сброс пароля по ссылке (nodemailer)
- Файлы архива хранятся на диске (`STORAGE_DIR`), превью изображений — sharp, выгрузка архива семьи — ZIP (archiver)

## Структура

| Путь | Что там |
| --- | --- |
| `src/app/(site)` | Публичный сайт: главная, фестиваль, истории, новости, поддержка, документы |
| `src/app/(auth)` | Вход, регистрация, подтверждение почты, сброс пароля, приглашения |
| `src/app/app` | Личный кабинет: семья, древо, архив, профиль |
| `src/app/admin` | Админ-панель: пользователи, семьи, заявки, истории, новости, задачи, контент |
| `src/app/api` | Подтверждение почты, отдача и загрузка файлов, выгрузка архива |
| `src/actions` | Server Actions (вся бизнес-логика форм) |
| `src/components/ui/BrandIcon.tsx` | Собственный набор анимированных иконок |
| `prisma/` | Схема, миграции, сид (админ, задачи, FAQ, программа, новость) |
| `ops/` | Скрипты подключения домена голосрода.рф к Nginx Proxy Manager |

## Локальный запуск

```bash
cp .env.example .env          # заполните AUTH_SECRET и ADMIN_PASSWORD
npm install
npm run db:up                 # PostgreSQL в Docker на порту 55440
npm run db:migrate
npm run db:seed
npm run dev                   # http://localhost:3010
```

## Продакшен

Приложение и база поднимаются через `docker-compose.prod.yml`. Внешний трафик и SSL обслуживает Nginx Proxy Manager, контейнер `svyaz_app` подключён к его сети `npm_network` и слушает порт 3000.

```bash
# .env рядом с compose-файлом: SITE_URL, DB_PASSWORD, AUTH_SECRET, ADMIN_EMAIL,
# ADMIN_PASSWORD, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM
docker compose -f docker-compose.prod.yml --env-file .env build svyaz_app
docker compose -f docker-compose.prod.yml --env-file .env up -d
```

При старте контейнер сам применяет миграции и сид (`docker-entrypoint.sh`). Данные лежат в `./data/postgres` и `./data/storage` — именно их нужно бэкапить.

В прокси-хосте для загрузки больших файлов нужны директивы:

```
client_max_body_size 210m; proxy_request_buffering off; proxy_read_timeout 3600s; proxy_send_timeout 3600s;
```
