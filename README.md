# Withdraw App

Тестовое задание: страница вывода средств (Withdraw) с API-интеграцией.

## Требования

- Node.js 18.17+ (рекомендуется 20+ для build)

## Запуск

```bash
npm install
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000), перейдите на страницу **Withdraw**.

## Тесты

npm test

## Ключевые решения

### Архитектура
- Next.js 14 App Router + TypeScript
- Zustand для глобального состояния (idle/loading/success/error)
- API-роуты в `src/app/api/v1/` — mock-сервер для разработки

### Безопасность
- Без `dangerouslySetInnerHTML` — весь контент рендерится как текст
- Токен не в localStorage: в текущей mock-версии auth не реализована. В продакшене рекомендуется:
  - HttpOnly cookies для access token (защита от XSS)
  - Refresh token в secure cookie
  - Короткий TTL access token (15–60 мин)

### API
- Idempotency-Key — уникальный ключ на каждый submit, передаётся в заголовке
- 409 Conflict — «Эта заявка уже была создана ранее»
- Retry — при сетевых ошибках до 3 попыток с экспоненциальной задержкой, данные формы сохраняются

### Устойчивость UI
- Защита от двойного submit: `isSubmitting` в Zustand + проверка `getState().isSubmitting` в начале handler
- Состояния: idle → loading → success/error
- Submit disabled при невалидной форме и во время запроса

### Валидация формы
- `amount` > 0
- `destination` не пустой
- `confirm` checkbox обязателен
- Submit доступен только при валидной форме
