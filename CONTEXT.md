# Kanban Board

A team task-management web app for small teams (2–15 people). Users organize work into boards, columns, and cards — similar to Trello.

## Language

**Board**:
A shared workspace owned by one user. Contains columns and cards. Members can collaborate on it; only the Owner can delete it.
_Avoid_: Project, workspace

**Column**:
A swimlane inside a Board representing a stage or category (e.g. To Do, Doing, Done). Has a name, optional color, and an ordered list of Cards.
_Avoid_: List, stage, lane

**Card**:
A single task inside a Column. Has a title, optional description, optional due date, labels, assignees, and subtasks.
_Avoid_: Task, ticket, item

**Label**:
A colored tag with a name, scoped to a single Board. A Card can have multiple Labels. One Label per Card can be designated as the Primary Label.
_Avoid_: Tag, category

**Primary Label**:
The one Label on a Card that is displayed prominently on the card face. All other labels are visible only inside the card detail view.
_Avoid_: Main label, featured label

**Subtask**:
A checklist item inside a Card. Can be checked (done) or unchecked. Progress is shown on the card face as "completed / total".
_Avoid_: Checklist item, child task, todo

**Assignee**:
A Member who has been assigned responsibility for a Card. A Card can have multiple Assignees. Shown as profile avatars on the card face.
_Avoid_: Owner (use Owner only for the Board creator)

**Owner**:
The Member who created a Board. Has exclusive permission to delete it.
_Avoid_: Admin, creator

**Member**:
A registered User who has been invited to a Board. Can create and manage columns and cards but cannot delete the Board.
_Avoid_: Collaborator, participant, user (use User for the account, Member for board-level role)

**User**:
A registered account in the system. Must log in to access any board.
_Avoid_: Account, person

## UI Patterns

**Side Drawer**:
The panel that slides in from the right to show Card detail. Opening a Card always uses this pattern — never a separate page or a centered modal.
_Avoid_: Modal, dialog, detail page

**Inline Input**:
The text input that appears at the bottom of a Column when "+ New card" is clicked. Pressing Enter creates the Card; pressing Escape cancels. Used only for Card creation — editing uses the Side Drawer.
_Avoid_: Quick add, inline editor
