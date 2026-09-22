# Taskio

A real-time collaborative Kanban board — boards, lists, and cards with
drag-and-drop reordering, built on React + Supabase (Postgres, Auth, Realtime).

## Features

- Email/password authentication (Supabase Auth)
- Create, rename, and delete boards
- Create, rename, and delete lists within a board
- Create and delete cards within a list
- Drag-and-drop reordering of both lists and cards, including moving a
  card between lists — positions persist to the database
- Realtime sync: changes made in one browser tab/window appear live in
  any other tab open on the same board, without a refresh
- Row Level Security in Postgres, so each user can only see and modify
  their own boards

## Tech stack

- React + Vite
- React Router (client-side routing)
- Supabase (Postgres database, Auth, Realtime subscriptions)
- @hello-pangea/dnd (drag-and-drop)

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create a project at [supabase.com](https://supabase.com), then in the
   SQL Editor run the entire contents of `supabase-setup.sql` from this
   repo. It creates the `boards`, `lists`, and `cards` tables, turns on
   Row Level Security with ownership-based policies, and enables Realtime
   on `lists` and `cards`.

3. Copy `.env.example` to `.env.local` and fill in your project's URL and
   publishable (anon) API key, both found under
   Project Settings → Data API / API Keys in the Supabase dashboard:
   ```
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your_publishable_key_here
   ```

4. In Supabase, under Authentication → Sign In / Providers, make sure
   Email is enabled. By default, new sign-ups require clicking a
   confirmation link sent by email — for quick local testing without
   email, you can add a user directly under Authentication → Users →
   Add User, with "Auto Confirm User" checked.

5. Run the dev server:
   ```
   npm run dev
   ```
   Open the printed local URL in your browser.

## Project structure

```
src/
├── App.jsx                     # Session handling + route definitions
├── main.jsx                    # Entry point, wraps App in BrowserRouter
├── lib/
│   └── supabaseClient.js       # Single Supabase client instance
└── features/
    ├── auth/
    │   └── AuthForm.jsx        # Sign up / log in form
    └── boards/
        ├── BoardsList.jsx      # Dashboard: create/view/delete boards
        ├── BoardPage.jsx       # Single board: lists, cards, drag-and-drop, realtime
        └── ListColumn.jsx      # One list and its cards
```

## Notes on data model

`lists.position` and `cards.position` are floats rather than array
indexes, which is what makes drag-and-drop reordering simple: on every
drag, the moved items' positions are rewritten in order (0, 1, 2, ...)
and persisted, rather than needing complex fractional-index math.

Row Level Security policies check ownership by walking up the
relationship: a card's visibility depends on its list's board's
`owner_id`, not on any field stored directly on the card itself.

## Possible next steps

- Multi-user boards (a `board_members` table + invite flow) — the schema
  was designed with this in mind but it isn't built yet
- Card details: due dates, labels, checklists, descriptions in the UI
  (the `cards.description` column already exists, just unused so far)
- Deploy to Vercel or Netlify for a live demo link
