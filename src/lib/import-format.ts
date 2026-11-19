export const IMPORT_EXAMPLE = {
  format: 'golos-roda/family@1',
  family: { name: 'Семья Ивановых' },
  persons: [
    { id: 'p1', firstName: 'Иван', lastName: 'Иванов', middleName: 'Петрович', gender: 'MALE', birthDate: '1930', deathDate: '2001' },
    { id: 'p2', firstName: 'Мария', lastName: 'Иванова', maidenName: 'Смирнова', gender: 'FEMALE', birthDate: '1934', deathDate: '2010' },
    { id: 'p3', firstName: 'Пётр', lastName: 'Иванов', middleName: 'Иванович', gender: 'MALE', birthDate: '1956' },
    { id: 'p4', firstName: 'Анна', lastName: 'Иванова', middleName: 'Ивановна', gender: 'FEMALE', birthDate: '1960' },
    { id: 'p5', firstName: 'Ольга', lastName: 'Иванова', gender: 'FEMALE' },
    { id: 'p6', firstName: 'Сергей', lastName: 'Иванов', middleName: 'Петрович', gender: 'MALE', birthDate: '1985' },
  ],
  relations: [
    { type: 'SPOUSE', from: 'p1', to: 'p2' },
    { type: 'PARENT', from: 'p1', to: 'p3' },
    { type: 'PARENT', from: 'p2', to: 'p3' },
    { type: 'PARENT', from: 'p1', to: 'p4' },
    { type: 'PARENT', from: 'p2', to: 'p4' },
    { type: 'SPOUSE', from: 'p3', to: 'p5' },
    { type: 'PARENT', from: 'p3', to: 'p6' },
    { type: 'PARENT', from: 'p5', to: 'p6' },
  ],
};

export const IMPORT_EXAMPLE_JSON = JSON.stringify(IMPORT_EXAMPLE, null, 2);

export const AI_PROMPT = `На изображении — схема родового дерева. Перепиши её в JSON строго по формату ниже. Верни только JSON, без пояснений и без markdown.

Правила:
1. "persons" — каждый человек со схемы ровно один раз.
   - "id" — короткий уникальный код: "p1", "p2", …
   - "firstName" — имя (обязательно), "lastName" — фамилия, "middleName" — отчество, "maidenName" — девичья фамилия.
   - "gender" — "MALE", "FEMALE" или "UNKNOWN".
   - "birthDate", "deathDate" — как написано на схеме (год или дата строкой). Если неизвестно — не добавляй поле.
2. "relations" — связи по id:
   - {"type": "PARENT", "from": id родителя, "to": id ребёнка} — отдельно для каждого родителя (у ребёнка не больше двух родителей);
   - {"type": "SPOUSE", "from": id, "to": id} — супруги;
   - {"type": "SIBLING", "from": id, "to": id} — только для братьев и сестёр, чьи родители на схеме не указаны.
3. Ничего не придумывай. Если имя не читается — пиши "?". Не добавляй людей, которых нет на схеме.

Формат (пример):
${IMPORT_EXAMPLE_JSON}`;
