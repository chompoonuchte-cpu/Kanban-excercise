# PRD — Kanban Board App

## Problem Statement

Small teams (2–15 people) need a simple, visual way to track who is doing what and which tasks are approaching their deadlines. Existing tools are either too heavyweight or require setup that exceeds the team's needs. The team wants a lightweight, browser-based Kanban board where everyone can see the big picture, drag tasks between stages, and stay roughly in sync — without real-time infrastructure complexity.

## Solution

A single-page web application that lets authenticated Users create Boards, organize work into Columns and Cards, and collaborate with invited Members. Cards support due dates, Labels, Assignees, and Subtasks. Drag-and-drop drives the primary interaction for moving Cards between Columns, reordering Cards within a Column, and reordering Subtasks. The UI responds optimistically to user actions and periodically polls for teammate changes.

## User Stories

### Authentication

1. As a visitor, I want to register with a display name, email, and password, so that I can access the app.
2. As a visitor, I want to log in with my email and password, so that I can access my Boards.
3. As a User, I want to log out, so that my session ends on the current device.
4. As a visitor, I want to be redirected to the login page when I try to access any Board without being logged in, so that unauthenticated access is prevented.
5. As a User, I want my session to persist for 7 days without re-logging in, so that I don't have to authenticate constantly.

### Profile

6. As a User, I want to view my profile page, so that I can see my current display name and email.
7. As a User, I want to edit my display name, so that teammates see the name I prefer.
8. As a User, I want to change my email address, so that I can keep my account up to date.
9. As a User, I want to change my password (minimum 8 characters, must confirm), so that I can maintain account security.

### Board List

10. As a User, I want to see a card grid of all Boards I own or am a Member of, so that I can pick which Board to work on.
11. As a User, I want to create a new Board with a name, so that I can start organizing work.
12. As an Owner, I want to rename my Board, so that the name stays relevant.
13. As an Owner, I want to delete my Board, so that I can remove Boards no longer needed.
14. As a Member, I want to be prevented from deleting a Board, so that only the Owner controls Board lifecycle.

### Board Membership

15. As an Owner or Member, I want to invite a registered User to my Board by searching their name or email, so that they can collaborate immediately without an acceptance step.
16. As an Owner or Member, I want to see the list of Members on a Board, so that I know who has access.

### Columns

17. As a Member, I want to add a new Column to a Board, so that I can define workflow stages.
18. As a Member, I want to rename a Column, so that the stage label stays accurate.
19. As a Member, I want to delete a Column, so that I can remove stages no longer needed.
20. As a Member, I want to reorder Columns by dragging, so that the workflow reads left-to-right in the order I choose.
21. As a Member, I want to set a Column's color from a preset palette or custom hex picker, so that Columns are visually distinct.
22. As a Member, I want to remove a Column's color so it reverts to the default gray, so that I can undo color choices.
23. As a Member, I want to see the Card count next to each Column header, so that I know the workload distribution at a glance.

### Cards — Board View

24. As a Member, I want to create a new Card via an Inline Input at the bottom of a Column, so that I can quickly add tasks.
25. As a Member, I want to see each Card's title on the board, so that I can scan tasks.
26. As a Member, I want to see the Primary Label displayed prominently on the Card face, so that I can identify the Card's category at a glance.
27. As a Member, I want to see Assignee avatars (initials) on the Card face, so that I know who is responsible.
28. As a Member, I want to see the due date on the Card face, so that I know when it's due.
29. As a Member, I want overdue Cards to be visually distinct (e.g. red date text), so that I can spot late tasks immediately.
30. As a Member, I want to see Subtask progress (e.g. "3/8") on the Card face, so that I can gauge completion without opening the Card.
31. As a Member, I want to drag a Card to a different Column, so that I can change its workflow stage.
32. As a Member, I want to drag a Card within the same Column to reorder it, so that I can prioritize tasks.
33. As a Member, I want drag-and-drop to feel smooth, with the new position persisted so it survives a page refresh.

### Cards — Side Drawer (Detail View)

34. As a Member, I want to click a Card to open a Side Drawer from the right, so that I can view and edit all Card details.
35. As a Member, I want to edit the Card title inline in the Side Drawer.
36. As a Member, I want to add or edit a plain-text description (max 5,000 characters) in the Side Drawer.
37. As a Member, I want to set a due date and time via a date-time picker, defaulting to 23:59 if no time is selected.
38. As a Member, I want to add or remove Labels on a Card, choosing from the Board's label pool.
39. As a Member, I want to designate one of the Card's Labels as the Primary Label, so that it appears on the Card face.
40. As a Member, I want to assign or unassign Members as Assignees on a Card.
41. As a Member, I want to move a Card to a different Column from within the Side Drawer.
42. As a Member, I want to delete a Card from the Side Drawer.

### Subtasks

43. As a Member, I want to add a Subtask (max 20 per Card) with a name inside the Side Drawer.
44. As a Member, I want to check or uncheck a Subtask to mark it done or not done.
45. As a Member, I want to edit a Subtask's name.
46. As a Member, I want to reorder Subtasks by dragging within the Side Drawer.
47. As a Member, I want to delete a Subtask.
48. As a Member, I want Subtask progress to update on the Card face immediately when I check/uncheck.

### Labels

49. As a Member, I want to create a new Label on a Board with a name and a color chosen from a preset palette.
50. As a Member, I want to edit a Label's name.
51. As a Member, I want to change a Label's color to a different preset.
52. As a Member, I want to delete a Label from the Board, removing it from all Cards that had it.

### Near-Real-Time Collaboration

53. As a Member, I want the Board to automatically refresh periodically (every 10–15 seconds), so that I see teammates' changes without manually reloading.
54. As a Member, I want the refresh to be non-disruptive — it should not interrupt my current drag or edit.

### Optimistic Updates & Error Handling

55. As a Member, I want my actions (move Card, check Subtask, etc.) to reflect immediately in the UI without waiting for the server.
56. As a Member, I want to see a toast notification if the server rejects my action, so that I understand why the UI rolled back.

### Validation

57. As a User, I want to see validation errors when I submit invalid data (empty title, title too long, password too short, password confirmation mismatch), so that I can correct my input.

## Implementation Decisions

### Architecture

- **Monorepo** with three top-level directories: `client/`, `server/`, `shared/`.
- `shared/` contains TypeScript types, constants (e.g. label color presets, validation limits), and validation schemas consumed by both client and server.

### Backend

- **Express** (Node.js) REST API.
- **Prisma** ORM with **PostgreSQL**.
- JWT access token (single token, 7-day expiry) stored in `localStorage`, sent via `Authorization: Bearer` header (see ADR-0002).

### Frontend

- **React 19** + **Vite** + **TypeScript**.
- **React Router** for client-side routing.
- **TanStack Query** for server state, caching, optimistic updates, and polling (`refetchInterval`).
- **Tailwind CSS** for styling.
- **@dnd-kit** for all drag-and-drop (Cards across/within Columns, Column reorder, Subtask reorder).
- **Toast library** (e.g. `react-hot-toast` or `sonner`) for rollback notifications.

### Data Model (key decisions)

- Card and Column ordering uses **float `position`** — inserting between two items averages their positions, requiring only a single-row UPDATE (see ADR-0001).
- Subtask ordering also uses float position.
- Column `color` is a **nullable hex string** (`#RRGGBB`). `null` means default gray. UI provides a preset palette plus a custom color picker.
- Label `color` is a **preset enum** — a fixed set of 10–12 distinguishable colors. No custom hex.
- Label is scoped to a single Board. Each Board has its own set of Labels.
- One Label per Card can be designated as the **Primary Label**, displayed on the Card face. Other Labels are visible in the Side Drawer.
- Due date is stored as `TIMESTAMPTZ`. A Card is overdue when `now() > dueDate`. If the user selects a date without specifying a time, the time defaults to 23:59.
- User avatars are **initials only** — generated at the frontend from the user's display name. No image upload.

### API Design

- **REST** endpoints under `/api/`.
- Board view uses **eager loading**: `GET /api/boards/:id` returns the Board with all Columns, Cards (with Primary Label, Assignee summaries, Subtask counts), in a single response. Full Subtask details are loaded when the Side Drawer opens.
- Polling: client sets `refetchInterval` on the board query (10–15 seconds).

### Invitation Flow

- Search registered Users by name or email, add them as Members immediately — no acceptance step required.

### Board List

- Shows only Boards where the current User is Owner or Member, displayed as a **card grid**.

### Card Detail

- Always opens in a **Side Drawer** (slides from right). Never a modal or separate page.
- Description is **plain text** only.

## Testing Decisions

### Philosophy

Tests verify **external behavior**, not implementation details. A good test calls a public interface (HTTP endpoint, rendered component) and asserts on observable output (response body/status, rendered DOM, visible text). Internal function signatures, database queries, and state shapes are not asserted directly.

### Test Seams

1. **REST API layer** (primary seam) — Integration tests using supertest + Vitest against a running Express app connected to a test PostgreSQL database. Covers: authentication, authorization (Owner vs Member), CRUD for all resources, validation rules, drag-and-drop position updates, optimistic-update-compatible response shapes.

2. **Database layer** — Prisma schema tests verifying constraints, relations, and cascading behavior (e.g. deleting a Board cascades to Columns, Cards, Subtasks, Labels). Runs against a test database.

3. **React component layer** — UI behavior tests using React Testing Library + Vitest. Covers: Board renders Cards in correct Columns, overdue badge appears when `now() > dueDate`, toast appears on mutation failure, Card face shows Primary Label / Assignee initials / Subtask progress, Side Drawer opens on Card click.

### Prior Art

No existing tests in the codebase. Vitest will be set up for both `client/` and `server/`.

## Out of Scope

Per the Product Spec, the following are explicitly deferred beyond v1:

- Notification system (in-app or email)
- Comments on Cards / file attachments
- Alternative views (calendar, timeline, reports)
- Granular roles/permissions beyond Owner and Member
- Mobile app
- Rich text / Markdown in Card descriptions
- User avatar image upload
- Invite-with-acceptance flow
- Refresh token rotation
- WebSocket / SSE real-time updates

## Further Notes

- The domain glossary in `CONTEXT.md` defines the canonical vocabulary. All UI copy, API field names, and test descriptions should use these terms (Board, Column, Card, Label, Primary Label, Subtask, Assignee, Owner, Member, User, Side Drawer, Inline Input).
- ADR-0001 (float position ordering) and ADR-0002 (JWT in localStorage) are already decided and should not be revisited.
- The app displays dates in Thai locale format (e.g. "14 มิ.ย. 2569") as shown in the mockup. Locale handling should be consistent across the UI.
