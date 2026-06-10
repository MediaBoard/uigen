# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Initial setup (first time only)
npm run setup          # install deps + prisma generate + migrate

# Development
npm run dev            # Turbopack dev server at localhost:3000
npm run dev:daemon     # Background server, logs to logs.txt

# Build & production
npm run build
npm start

# Lint
npm run lint

# Tests
npm run test                              # all tests
npm run test -- ChatInterface.test.tsx    # single test file
npm run test -- --watch                   # watch mode

# Database
npm run db:reset                          # destructive reset
npx prisma migrate dev                    # run pending migrations
npx prisma generate                       # regenerate client
npx prisma studio                         # GUI browser
```

All `dev` and `build` scripts prefix commands with `NODE_OPTIONS='--require ./node-compat.cjs'` — this is intentional and required.

## Environment

Copy `.env` and set:
- `ANTHROPIC_API_KEY` — optional; omit to use the built-in mock provider
- `JWT_SECRET` — optional; defaults to `"development-secret-key"` in dev

## Architecture

**Stack**: Next.js 15 App Router, React 19, TypeScript, Prisma (SQLite), Vercel AI SDK, Tailwind v4, Shadcn UI.

### Core data flow

1. User sends a chat message → `POST /api/chat`
2. Server runs `streamText()` (Vercel AI SDK) with the Anthropic model (or mock)
3. AI responds with text and/or tool calls (`str_replace_editor`, `file_manager`)
4. Tool results are streamed back; the client's `FileSystemContext` applies file mutations to the in-memory `VirtualFileSystem`
5. On completion, the serialized file system + messages are written back to `Project.data` / `Project.messages` in SQLite (authenticated users only)

### Key modules

| Path | Role |
|------|------|
| `src/lib/file-system.ts` | `VirtualFileSystem` — Map-backed, in-memory FS; `serialize()`/`deserialize()` for Prisma persistence |
| `src/lib/contexts/file-system-context.tsx` | React context wrapping VirtualFileSystem; dispatches AI tool-call results as file ops |
| `src/lib/contexts/chat-context.tsx` | Wraps Vercel AI SDK `useChat`; manages messages and tool-call routing |
| `src/lib/provider.ts` | Returns Anthropic (`claude-haiku-4-5`) or `MockLanguageModel`; max 10k tokens, 40 tool steps |
| `src/lib/tools/str-replace.ts` | `str_replace_editor` tool: `view`, `create`, `str_replace`, `insert`, `undo` commands |
| `src/lib/tools/file-manager.ts` | `file_manager` tool: `list`, `delete`, `view`, `create`, `rename` commands |
| `src/app/api/chat/route.ts` | Streaming endpoint; persists project on `onFinish` |
| `src/lib/auth.ts` | JWT sessions via `jose`; 7-day HttpOnly cookies |
| `src/actions/index.ts` | Server Actions: signUp, signIn, signOut, getUser (bcrypt, 10 rounds) |
| `src/lib/transform/jsx-transformer.ts` | Babel-based JSX → JS transform for the browser preview iframe |
| `src/lib/prompts/generation.tsx` | System prompt sent to the AI on every chat request |
| `src/lib/anon-work-tracker.ts` | `sessionStorage` helpers to preserve anonymous work across sign-in |

### Database schema (SQLite)

```
User    { id, email, password, projects[] }
Project { id, name, userId?, messages (JSON string), data (JSON string) }
```

Anonymous projects have `userId = null` and are not persisted between sessions. When an anonymous user signs in, `anon-work-tracker` recovers their `sessionStorage` data so it can be migrated to their account.

### UI layout

`main-content.tsx` renders two `react-resizable-panels`:
- Left (35%): `ChatInterface`
- Right (65%): tabs for live Preview (`PreviewFrame` — iframe with Babel-compiled output) and Code (file tree 30% + Monaco editor 70%)

### Preview pipeline

`PreviewFrame` → `createImportMap()` → `createPreviewHTML()` → iframe `srcdoc`

1. Each `.jsx`/`.tsx`/`.js`/`.ts` file in `VirtualFileSystem` is compiled by `@babel/standalone` to plain JS.
2. Compiled output is packaged into a `Blob` URL.
3. An [import map](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap) is injected into the iframe, mapping each virtual path and its `@/`-aliased variants to its Blob URL.
4. Third-party packages (non-relative imports) are automatically forwarded to `https://esm.sh/<package>`.
5. Missing local imports get a stub placeholder module so the preview doesn't crash.
6. Tailwind CSS is loaded from CDN (`cdn.tailwindcss.com`) inside the iframe — no build step needed in preview.
7. An `ErrorBoundary` wraps the root render; Babel syntax errors show a styled error panel instead of a blank iframe.

The iframe runs with `sandbox="allow-scripts allow-same-origin allow-forms"` — required for Blob URL module imports.

### AI system prompt constraints (`src/lib/prompts/generation.tsx`)

The system prompt enforces rules the AI must follow when generating code. When editing generated components, match these conventions:

- Every project must have `/App.jsx` as the root entry point with a default export.
- All non-library local imports use the `@/` alias (e.g., `@/components/Button`), which maps to the virtual FS root `/`.
- Style exclusively with Tailwind classes — no hardcoded inline styles.
- No HTML files; `App.jsx` is the only entry point.

> **Note on `@/` alias duality**: In this Next.js project's own source, `@/` maps to `src/` (standard tsconfig paths). Inside the *AI-generated* virtual file system, `@/` maps to the virtual root `/`. These are two separate resolution systems.

### Mock provider

When `ANTHROPIC_API_KEY` is absent, `MockLanguageModel` in `src/lib/provider.ts` simulates multi-step tool calling with hardcoded component examples (max 4 steps). Useful for offline development.

### Tests

Tests use **Vitest** with a `jsdom` environment and `@testing-library/react`. Config is in `vitest.config.mts`. Test files live in `__tests__/` subdirectories next to the code they test (e.g., `src/components/chat/__tests__/`).
