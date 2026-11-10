import 'server-only';
import nodemailer from 'nodemailer';

let transport: nodemailer.Transporter | null = null;

function getTransport() {
  if (!process.env.SMTP_HOST) return null;
  transport ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 465),
    secure: Number(process.env.SMTP_PORT || 465) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  return transport;
}

export function siteUrl(path = '') {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3010').replace(/\/$/, '') + path;
}

function esc(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

function layout({ title, intro, button, url, outro }: { title: string; intro: string; button: string; url: string; outro: string }) {
  return `<!doctype html><html lang="ru"><body style="margin:0;background:#f6efe4;font-family:Arial,Helvetica,sans-serif;color:#1d1915">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f6efe4;padding:32px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden">
<tr><td style="background:#1d1915;padding:28px 36px;color:#d9a86c;font-family:Georgia,serif;font-size:22px">∞&nbsp; Голос рода</td></tr>
<tr><td style="padding:36px">
<h1 style="margin:0 0 16px;font-family:Georgia,serif;font-size:26px;font-weight:normal;color:#1d1915">${esc(title)}</h1>
<p style="margin:0 0 28px;font-size:16px;line-height:1.6;color:#4a423a">${intro}</p>
<a href="${url}" style="display:inline-block;background:#c58d4f;color:#1d1915;text-decoration:none;font-weight:bold;font-size:15px;padding:14px 28px;border-radius:999px">${esc(button)}</a>
<p style="margin:28px 0 0;font-size:13px;line-height:1.6;color:#8a8076">${outro}</p>
<p style="margin:16px 0 0;font-size:12px;line-height:1.5;color:#a59b90;word-break:break-all">Если кнопка не работает, откройте ссылку:<br><a href="${url}" style="color:#a8733c">${url}</a></p>
</td></tr>
<tr><td style="padding:20px 36px;border-top:1px solid #eee5d8;font-size:12px;color:#a59b90">Общественный проект «Голос рода» · <a href="${siteUrl('/')}" style="color:#a8733c">svyaz-pokoleny.ru</a></td></tr>
</table></td></tr></table></body></html>`;
}

async function send(to: string, subject: string, html: string, text: string) {
  const t = getTransport();
  if (!t) {
    console.log(`[mail disabled] to=${to} subject=${subject}\n${text}`);
    return;
  }
  await t.sendMail({ from: process.env.MAIL_FROM || process.env.SMTP_USER, to, subject, html, text });
}

export async function sendVerifyEmail(to: string, name: string, url: string) {
  await send(
    to,
    'Подтвердите почту — «Голос рода»',
    layout({
      title: `${name}, добро пожаловать!`,
      intro: 'Осталось подтвердить адрес электронной почты — и можно начинать семейное дерево и архив.',
      button: 'Подтвердить почту',
      url,
      outro: 'Ссылка действует 48 часов. Если вы не регистрировались на сайте svyaz-pokoleny.ru, просто проигнорируйте письмо.',
    }),
    `Здравствуйте, ${name}!\n\nПодтвердите почту, чтобы начать работу на платформе «Голос рода»:\n${url}\n\nСсылка действует 48 часов.`,
  );
}

export async function sendResetEmail(to: string, name: string, url: string) {
  await send(
    to,
    'Восстановление пароля — «Голос рода»',
    layout({
      title: 'Восстановление пароля',
      intro: `${esc(name)}, мы получили запрос на смену пароля. Нажмите кнопку, чтобы задать новый.`,
      button: 'Задать новый пароль',
      url,
      outro: 'Ссылка действует 2 часа. Если вы не запрашивали смену пароля, ничего не делайте — пароль останется прежним.',
    }),
    `Здравствуйте, ${name}!\n\nЧтобы задать новый пароль, откройте ссылку:\n${url}\n\nСсылка действует 2 часа.`,
  );
}
