import type { MaterialType, RequestKind, RequestStatus, RegistrationStatus, StoryStatus, Visibility } from '@prisma/client';

export const FESTIVAL_ZONES = [
  {
    name: 'Моё семейное дерево',
    what: 'Регистрация и создание первых связей при поддержке волонтёров.',
    result: 'Начальная цифровая родословная',
    icon: 'tree',
  },
  {
    name: 'Голос поколений',
    what: 'Запись добровольных аудио- и видеоисторий с согласиями.',
    result: 'Сохранённое воспоминание',
    icon: 'mic',
  },
  {
    name: 'Семейный архив',
    what: 'Сканирование семейных фотографий и документов.',
    result: 'Цифровая копия материала',
    icon: 'archive',
  },
  {
    name: 'Найди свои корни',
    what: 'Консультации по генеалогии и архивным поискам.',
    result: 'Маршрут дальнейшего исследования',
    icon: 'search',
  },
  {
    name: 'Истории, которые нас объединяют',
    what: 'Экспозиция историй семей с разрешения участников.',
    result: 'Вдохновение на собственный поиск',
    icon: 'book',
  },
] as const;

export const FESTIVAL_ZONE_NAMES: string[] = FESTIVAL_ZONES.map((z) => z.name);

export const MATERIAL_LABEL: Record<MaterialType, string> = {
  PHOTO: 'Фотография',
  DOCUMENT: 'Документ',
  MEMORY: 'Воспоминание',
  AUDIO: 'Аудиозапись',
  VIDEO: 'Видео',
  LINK: 'Ссылка',
};

export const MATERIAL_PLURAL: Record<MaterialType, string> = {
  PHOTO: 'Фотографии',
  DOCUMENT: 'Документы',
  MEMORY: 'Воспоминания',
  AUDIO: 'Аудио',
  VIDEO: 'Видео',
  LINK: 'Ссылки',
};

export const VISIBILITY_LABEL: Record<Visibility, string> = {
  FAMILY: 'Вся семья',
  EDITORS: 'Хранители и соавторы',
  PRIVATE: 'Только я',
};

export const REQUEST_KIND_LABEL: Record<RequestKind, string> = {
  DONATION: 'Пожертвование',
  SPONSOR: 'Спонсорство',
  VENUE: 'Площадка и ресурсы',
  PROFESSIONAL: 'Профессиональное участие',
  VOLUNTEER: 'Волонтёрство',
  OPERATOR: 'Будущий оператор',
  MEDIA: 'СМИ и информационная поддержка',
  CONTACT: 'Вопрос / связь',
};

export const REQUEST_STATUS_LABEL: Record<RequestStatus, string> = {
  NEW: 'Новая',
  IN_PROGRESS: 'В работе',
  DONE: 'Завершена',
  ARCHIVED: 'В архиве',
};

export const REG_STATUS_LABEL: Record<RegistrationStatus, string> = {
  NEW: 'Новая',
  CONFIRMED: 'Подтверждена',
  ATTENDED: 'Пришли',
  CANCELLED: 'Отменена',
};

export const STORY_STATUS_LABEL: Record<StoryStatus, string> = {
  PENDING: 'На модерации',
  APPROVED: 'Опубликована',
  REJECTED: 'Отклонена',
};

export const TASK_ICONS = ['sparkles', 'mic', 'camera', 'gem', 'mail', 'book', 'map', 'utensils', 'music', 'heart'] as const;
