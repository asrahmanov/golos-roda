import type { Metadata, Viewport } from 'next';
import '@fontsource-variable/manrope';
import '@fontsource-variable/playfair-display';
import './globals.css';

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://svyaz-pokoleny.ru';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: 'Голос рода — сохраним историю семьи вместе',
    template: '%s · Голос рода',
  },
  description:
    'Общественный проект «Голос рода»: цифровое семейное дерево, архив фотографий, документов и воспоминаний, семейный фестиваль 22 ноября 2026 в Москве.',
  keywords: ['родословная', 'семейное дерево', 'семейный архив', 'история семьи', 'фестиваль', 'голос рода', 'история рода', 'Москва'],
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'Голос рода',
    title: 'Голос рода — сохраним историю семьи вместе',
    description: 'Сохраняя прошлое, мы объединяем людей в настоящем и оставляем наследие будущему.',
    images: ['/img/sculpture.jpg'],
  },
  icons: { icon: '/icon.svg' },
};

export const viewport: Viewport = {
  themeColor: '#1d1916',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
