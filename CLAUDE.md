# CLAUDE.md - QQ Calendar Project Guide

## Project Overview

QQ Calendar is a team collaboration diary/calendar application for tracking daily work records. Built for a team of 3 users (QQrou, QQfang, QQwen), it features real-time synchronization, a Chiikawa-inspired cute UI theme, and Supabase backend integration.

**Primary Language:** TypeScript
**UI Language:** Chinese (Simplified)

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | React 18.2 |
| Build Tool | Vite 5.0 |
| Language | TypeScript 5.3 (strict mode) |
| State Management | Zustand 4.4 with persist middleware |
| Backend | Supabase (PostgreSQL + Realtime) |
| 3D Graphics | Three.js 0.160 / React Three Fiber (optional features) |

## Project Structure

```
src/
├── components/          # React UI components
│   ├── Memo.tsx         # Main records/todos panel with tabs
│   ├── Calendar2D.tsx   # 2D calendar grid with month navigation
│   ├── InputBar.tsx     # New record form (worker multi-select)
│   ├── DiaryModal.tsx   # View/edit record modal
│   ├── TitleBar.tsx     # Header with user info, export, filters
│   ├── LoginModal.tsx   # Authentication modal
│   ├── RecordList.tsx   # All records list panel
│   └── MissingVehicleList.tsx  # Records missing vehicle numbers
├── hooks/
│   ├── useAuth.ts       # Initial data loading on mount
│   └── useRealtime.ts   # Supabase realtime subscriptions
├── lib/
│   ├── supabase.ts      # Supabase client initialization
│   ├── diary.ts         # CRUD for diaries, remarks, todos
│   ├── users.ts         # Local user authentication (3 users)
│   ├── flowers.ts       # Flower type icons (1-5)
│   └── export.ts        # JSON export functionality
├── stores/
│   └── appStore.ts      # Zustand store with persistence
├── types/
│   └── database.ts      # TypeScript interfaces for DB tables
├── App.tsx              # Main app component
├── App.css              # Global styles (pink/pastel theme)
└── main.tsx             # React DOM entry point
```

## Development Commands

```bash
npm run dev      # Start dev server at http://localhost:5173
npm run build    # TypeScript check + Vite production build
npm run preview  # Preview production build
```

## Environment Setup

Copy `.env.example` to `.env` and configure:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_USER_QQROU_PASSWORD=password1
VITE_USER_QQFANG_PASSWORD=password2
VITE_USER_QQWEN_PASSWORD=password3
```

## Database Schema

### Tables

**diaries** - Main work records
- `id` (UUID, primary key)
- `user_id`, `user_name` - Creator info
- `status` - 'complete' | 'incomplete'
- `customer` - Garden owner name
- `worker` - Worker(s) assigned
- `vehicle` - Vehicle number
- `remark` - Notes
- `flower_type` - Category (1-5)
- `operators` - Users who edited (array)
- `created_at`, `updated_at` - Timestamps

**diary_remarks** - Comments on records
- `id`, `diary_id`, `user_name`, `content`, `created_at`

**todos** - Task list items
- `id`, `text`, `done`, `user_name`, `created_at`

## Key Code Patterns

### State Management (Zustand)

```typescript
// Access store
const { diaries, addDiary, setLoading } = useAppStore();

// Store persists auth state to localStorage under 'qq-calendar-auth'
// Session expires after 24 hours
```

### Database Operations (src/lib/diary.ts)

```typescript
// All DB operations are async and handle errors internally
await createDiary(data);
await updateDiary(id, updates);
await deleteDiary(id);
await fetchDiaries();
await fetchRemarks();
await fetchTodos();
```

### Real-time Sync (src/hooks/useRealtime.ts)

```typescript
// Subscribes to Supabase realtime channels
// Automatically updates store on INSERT/UPDATE/DELETE events
// Channels: diaries, diary_remarks, todos
```

### User Authentication (src/lib/users.ts)

```typescript
// Three hardcoded users with passwords in env vars
// authenticateUser(username, password) => LocalUser | null
// Session stored in Zustand with 24h expiry
```

## Code Conventions

### TypeScript
- Strict mode enabled
- All database types defined in `src/types/database.ts`
- Use type imports: `import type { Diary } from '../types/database'`

### React
- Functional components only
- Custom hooks for side effects (useAuth, useRealtime)
- Error handling with console.warn/error + user alerts

### Styling
- Chiikawa theme: pastel pink gradients (#fff0f5, #ffe4ec)
- CSS in App.css (not modules)
- Heavy emoji usage for icons

### Database
- Row Level Security (RLS) disabled for simplicity
- Real-time enabled for all tables
- No cloud authentication - local password checking

## Common Development Tasks

### Adding a new field to diaries
1. Update `src/types/database.ts` - add to Diary, DiaryInsert, DiaryUpdate interfaces
2. Update `supabase-setup.sql` - add column to diaries table
3. Update relevant components (InputBar.tsx, DiaryModal.tsx)
4. Run SQL migration on Supabase

### Adding a new user
1. Add user config in `src/lib/users.ts` USER_CONFIG array
2. Add password env var in `.env` and `.env.example`
3. Update `getPasswordForUser()` switch statement
4. Update `InputUser` type in `src/stores/appStore.ts`

### Modifying the store
1. Add state property to `AppState` interface in `appStore.ts`
2. Add initial value in store creation
3. Add action if needed
4. If should persist, add to `partialize` function

## Important Files Reference

| File | Purpose |
|------|---------|
| `src/stores/appStore.ts` | Central state management |
| `src/lib/diary.ts` | All database CRUD operations |
| `src/lib/users.ts` | Authentication logic |
| `src/hooks/useRealtime.ts` | Real-time subscriptions |
| `src/types/database.ts` | All TypeScript types |
| `supabase-setup.sql` | Database schema |

## Debugging Tips

- Check browser console for Supabase errors
- Verify `.env` has correct Supabase URL/key
- Real-time not working? Check Supabase dashboard for realtime status
- Session issues? Clear localStorage key 'qq-calendar-auth'

## Notes for AI Assistants

1. **Language**: UI and comments are in Chinese - preserve this convention
2. **Users**: Fixed set of 3 users - don't add cloud auth
3. **Simplicity**: Avoid over-engineering; this is a small team tool
4. **Real-time**: Test changes with multiple browser tabs to verify sync
5. **No RLS**: Database uses simple access - don't add row-level security
6. **Build**: Always run `npm run build` to verify TypeScript before committing
