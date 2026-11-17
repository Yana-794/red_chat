# FSD layers

- `app` — Next.js App Router: routes, root layout and providers.
- `widgets` — screen-level compositions: chat, profile modal and auth form.
- `features` — user scenarios: auth, conversations, chat socket, messages and profile.
- `entities` — domain types: User, Conversation and Message.
- `shared` — API client and shared configuration.

The Next.js App Router owns routing, so a separate FSD `pages` layer is not used.

## Feature locations

- `features/auth` — registration, login and current session.
- `features/conversations` — user search, list and direct-dialog creation.
- `features/chat/model/useChatSocket.ts` — authenticated WebSocket connection.
- `features/messages` — cursor-paginated history, files, edit, delete and reactions.
- `features/profile` — profile update and avatar upload.
