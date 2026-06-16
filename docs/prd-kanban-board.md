# PRD: Kanban Board App

## Problem Statement

Small teams (2–15 people) have no shared visual tool to track who is doing what, what stage each task is in, and what is approaching its deadline. Without this, work gets lost, duplicates appear, and status updates require manual check-ins.

## Solution

A web-based single-page Kanban Board app where authenticated Users can create Boards, organise work into Columns, and manage Cards via drag-and-drop. Every Member of a Board sees the same state, which refreshes automatically every 15 seconds without requiring a page reload.

## User Stories

### Authentication
1. As a visitor, I want to register with my name, email, and password, so that I can access the app.
2. As a visitor, I want to log in with my email and password, so that I can reach my Boards.
3. As a logged-in User, I want to log out, so that my session ends on this device.
4. As a logged-in User, I want to view my profile page, so that I can see my current display name and email.
5. As a logged-in User, I want to change my display name, so that teammates see the right name on my avatar.
6. As a logged-in User, I want to change my email address, so that I can keep my account up to date.
7. As a logged-in User, I want to change my password, so that I can maintain account security.
8. As a visitor who has not logged in, I want to be redirected to the login page when I try to open a Board URL, so that unauthorised access is prevented.

### Board Management
9. As a logged-in User, I want to see a grid of all my Boards split into "My Boards" and "Shared with me", so that I can quickly find the Board I need.
10. As a logged-in User, I want to create a new Board with a name, so that I can start organising work for a project.
11. As a Board Owner, I want to rename my Board, so that the name stays accurate as the project evolves.
12. As a Board Owner, I want to delete my Board, so that I can remove workspaces that are no longer needed.
13. As a Member, I want to be prevented from deleting a Board I do not own, so that Owners retain control.
14. As a Board Owner, I want to invite an existing User by email to my Board, so that they can collaborate immediately without needing to accept an invitation.
15. As an invited User, I want to see the Board I was added to in my "Shared with me" section, so that I can start working without any extra steps.

### Column Management
16. As a Member, I want to add a Column to a Board with a name, so that I can define a new stage for work.
17. As a Member, I want to rename a Column, so that the stage name reflects current workflow.
18. As a Member, I want to delete a Column, so that unused stages can be removed.
19. As a Member, I want to drag Columns left or right to reorder them, so that the stages appear in the order that matches my workflow.
20. As a Member, I want to assign a color to a Column from a preset palette or a full color picker, so that I can visually distinguish stages at a glance.
21. As a Member, I want to remove the color from a Column and return it to the default grey, so that I can undo a color choice.
22. As a Member, I want to see the Column's color applied as a tinted background across the entire Column, so that the visual grouping is immediately obvious.

### Card Management
23. As a Member, I want to click "+ New card" at the bottom of a Column and type a title inline, so that I can quickly add tasks without leaving the Board.
24. As a Member, I want to press Enter to save a new Card or Escape to cancel, so that keyboard-driven workflows are fast.
25. As a Member, I want to open a Card in a Side Drawer by clicking on it, so that I can view and edit its full details without leaving the Board.
26. As a Member, I want to edit a Card's title in the Side Drawer, so that I can correct mistakes or clarify the task.
27. As a Member, I want to add or edit a Card's description in the Side Drawer, so that I can provide context for the task.
28. As a Member, I want to set a due date on a Card using a date picker, so that the team knows when the task must be completed.
29. As a Member, I want to see a due date that has passed displayed in red on the Card face, so that overdue tasks are immediately obvious.
30. As a Member, I want to clear a Card's due date, so that deadlines can be removed when no longer applicable.
31. As a Member, I want to delete a Card, so that completed or cancelled tasks can be removed.

### Labels
32. As a Member, I want to create a Label with a name and color on a Board, so that I can define tags relevant to that Board's work.
33. As a Member, I want to rename or recolor a Label, so that I can keep the tag vocabulary accurate.
34. As a Member, I want to attach multiple Labels to a Card, so that a task can belong to more than one category.
35. As a Member, I want to designate one attached Label as the Primary Label for a Card, so that the most important category is shown prominently on the Card face.
36. As a Member, I want non-primary Labels to be visible only in the Side Drawer, so that the Card face stays uncluttered.
37. As a Member, I want to detach a Label from a Card, so that incorrect tags can be removed.
38. As a Member, I want to delete a Label from a Board, so that unused tags do not accumulate.

### Assignees
39. As a Member, I want to assign one or more Members to a Card, so that responsibility is clear.
40. As a Member, I want to see assignee profile avatars on the Card face, so that I can tell at a glance who owns a task.
41. As a Member, I want to remove an Assignee from a Card, so that reassignments can be made cleanly.

### Subtasks
42. As a Member, I want to add Subtasks to a Card as a checklist, so that I can track smaller steps within a task.
43. As a Member, I want to check or uncheck a Subtask, so that I can mark steps as done or reopen them.
44. As a Member, I want to edit a Subtask's name, so that I can correct or clarify a step.
45. As a Member, I want to reorder Subtasks within a Card, so that I can arrange steps logically.
46. As a Member, I want to delete a Subtask, so that irrelevant steps can be removed.
47. As a Member, I want to see a progress indicator (e.g. "3 / 5") on the Card face, so that I can gauge task completion at a glance.

### Drag & Drop
48. As a Member, I want to drag a Card from one Column to another, so that I can update a task's status.
49. As a Member, I want to drag a Card up or down within the same Column, so that I can reprioritise tasks.
50. As a Member, I want the Board to respond instantly when I drop a Card (optimistic update), so that the interaction feels snappy.
51. As a Member, I want the Card position to revert automatically if the server rejects the move, so that the Board stays consistent.
52. As a Member, I want the Card's new position to persist after a page refresh, so that drag results are durable.

### Real-time Collaboration
53. As a Member, I want the Board to refresh automatically every 15 seconds, so that I see my teammates' changes without reloading.
54. As a Member, I want the Board to update silently in the background, so that my current interaction is not interrupted.

### Validation
55. As a Member, I want to see an error if I try to save a Board name that is empty or longer than 100 characters.
56. As a Member, I want to see an error if I try to save a Column name that is empty or longer than 100 characters.
57. As a Member, I want to see an error if I try to save a Card title that is empty or longer than 255 characters.
58. As a Member, I want to see an error if I try to save a Card description longer than 5,000 characters.
59. As a Member, I want to see an error if I try to save a Subtask name that is empty or longer than 100 characters.
60. As a Member, I want to see an error if I try to add a 21st Subtask to a Card, so that the 20-Subtask limit is enforced.
61. As a User, I want to see an error if my new password is shorter than 8 characters or the confirmation does not match.

## Implementation Decisions

### Monorepo Structure
- Frontend (React + Vite + TypeScript) lives at the repo root under `src/`
- Backend (Express + Node.js + TypeScript) lives under `server/`
- Each has its own `package.json`; a root-level script wires them together for development

### Backend
- **Framework**: Express with TypeScript
- **ORM / migrations**: Prisma against PostgreSQL
- **Auth**: JWT issued on login, stored client-side in `localStorage`, sent as `Authorization: Bearer <token>` on every request
- **Ordering**: Cards and Columns store a `position FLOAT` column. On move, the new position = average of the two neighbours' floats. No other rows are updated. See ADR-0001.

### Frontend
- **State**: TanStack Query manages all server state (fetch, cache, mutation, refetch). Zustand manages ephemeral UI state — primarily optimistic drag-and-drop positions before server confirmation.
- **Drag & Drop**: dnd-kit handles both cross-column Card moves and same-column reordering, as well as Column reordering.
- **Polling**: TanStack Query `refetchInterval: 15000` on the Board query.
- **Optimistic updates**: On drop, Zustand updates the local order immediately; TanStack Query mutation fires; on error, the Zustand state reverts.
- **Styling**: Tailwind CSS utility classes throughout. Column background uses a low-opacity tint derived from the Column color.
- **Card detail**: Side Drawer sliding in from the right. Never a separate page or centered modal.
- **New Card**: Inline text input at the bottom of the Column on "+ New card" click. Enter = save, Escape = cancel.

### Data Model (logical, not schema)
- **User**: id, name, email, hashed password
- **Board**: id, name, owner (User), members (User[])
- **Column**: id, board, name, color (nullable), position (float)
- **Card**: id, column, title, description (nullable), due_date (nullable), position (float)
- **Label**: id, board, name, color — scoped to one Board
- **CardLabel**: card, label, is_primary (bool)
- **CardAssignee**: card, user
- **Subtask**: id, card, name, is_done, position (float)

### API Shape (REST)
- `POST /auth/register`, `POST /auth/login`
- `GET/PATCH /users/me`
- `GET/POST /boards`, `GET/PATCH/DELETE /boards/:id`
- `POST /boards/:id/members` (invite by email)
- `GET/POST /boards/:id/columns`, `PATCH/DELETE /columns/:id`
- `GET/POST /columns/:id/cards`, `PATCH/DELETE /cards/:id`
- `PATCH /cards/:id/move` (column + position)
- `GET/POST /boards/:id/labels`, `PATCH/DELETE /labels/:id`
- `POST/DELETE /cards/:id/labels/:labelId`, `PATCH /cards/:id/labels/:labelId` (set primary)
- `POST/DELETE /cards/:id/assignees/:userId`
- `GET/POST /cards/:id/subtasks`, `PATCH/DELETE /subtasks/:id`

## Testing Decisions

A good test checks observable behaviour at the boundary — what a real client sends and receives — not internal implementation details like which Prisma query was called.

### Backend — API integration tests (supertest + real Prisma on a test DB)
- Each test suite seeds its own data and tears it down after
- Cover: auth flows, Board CRUD + ownership rules, Column CRUD + reorder, Card CRUD + move, Label CRUD + card attachment + primary designation, Subtask CRUD + reorder, invite-by-email, all validation constraints
- Do not mock Prisma — a mocked ORM would not catch constraint violations or ordering bugs

### Frontend — Component integration tests (React Testing Library + mocked TanStack Query)
- Render the Board page with a mock query provider returning fixture data
- Cover: Column list renders correctly, Card face shows primary label / due date / assignee avatars / subtask progress, overdue date appears red, inline Card creation flow, Side Drawer opens and saves changes, drag-and-drop optimistic update reverts on error
- Do not test Zustand store internals directly — test the UI that reflects store state

### Zustand store — Unit tests
- Test optimistic position update and revert logic in isolation, without rendering components
- Input: current card list + drop event; expected output: reordered list / reverted list

## Out of Scope

Per the product spec, the following are explicitly deferred to a later version:

- Notification system (in-app, email, or push)
- Comments on Cards
- File attachments on Cards
- Alternative Board views (calendar, timeline, report)
- Granular role permissions beyond Owner / Member
- Mobile app (web browser only for v1)

## Further Notes

- The `ready-for-agent` label signals this issue is fully specified and can be picked up by an AFK agent without additional human context.
- All domain terminology in this PRD follows `CONTEXT.md` at the repo root.
- Key architectural trade-offs are recorded in `docs/adr/0001-float-position-ordering.md` and `docs/adr/0002-jwt-localstorage.md`.
