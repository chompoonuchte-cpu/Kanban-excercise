import { useState, useEffect, type FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { apiFetch, ApiError } from "../lib/api.ts";

type ColumnData = { id: string; name: string; color: string | null; position: number };
type BoardData = { id: string; name: string; ownerId: string; columns: ColumnData[] };
type MemberEntry = {
  userId: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; displayName: string; email: string };
};
type SearchUser = { id: string; displayName: string; email: string };

const PRESET_COLORS = [
  "#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6",
  "#3B82F6", "#6366F1", "#A855F7", "#EC4899", "#6B7280",
];

export default function BoardPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [board, setBoard] = useState<BoardData | null>(null);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editColName, setEditColName] = useState("");
  const [editColColor, setEditColColor] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadBoard() {
    const data = await apiFetch<BoardData>(`/boards/${id}`);
    setBoard(data);
  }

  useEffect(() => {
    loadBoard();
    apiFetch<MemberEntry[]>(`/boards/${id}/members`).then(setMembers);
  }, [id]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(() => {
      apiFetch<SearchUser[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`).then(
        (users) => {
          const memberIds = new Set(members.map((m) => m.userId));
          setSearchResults(users.filter((u) => !memberIds.has(u.id)));
        },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, members]);

  async function handleInvite(userId: string) {
    setError("");
    try {
      await apiFetch(`/boards/${id}/members`, { method: "POST", body: JSON.stringify({ userId }) });
      const updated = await apiFetch<MemberEntry[]>(`/boards/${id}/members`);
      setMembers(updated);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed to invite"); }
  }

  async function handleRemove(userId: string) {
    await apiFetch(`/boards/${id}/members/${userId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  async function handleAddColumn(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await apiFetch(`/boards/${id}/columns`, {
        method: "POST",
        body: JSON.stringify({ name: newColName }),
      });
      setNewColName("");
      setShowAddColumn(false);
      await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed to add column"); }
  }

  async function handleUpdateColumn(colId: string) {
    setError("");
    try {
      await apiFetch(`/columns/${colId}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editColName, color: editColColor }),
      });
      setEditingColId(null);
      await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed to update column"); }
  }

  async function handleDeleteColumn(colId: string) {
    setError("");
    try {
      await apiFetch(`/columns/${colId}`, { method: "DELETE" });
      await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed to delete column"); }
  }

  if (!board) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:underline">&larr; Boards</Link>
          <h1 className="text-lg font-bold text-gray-800">{board.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setShowInvite(!showInvite)} className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700">+ Invite</button>
          <Link to="/profile" className="text-sm text-gray-500 hover:underline">{user?.displayName}</Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:underline">Logout</button>
        </div>
      </header>

      {error && <div className="mx-6 mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>}

      {showInvite && (
        <div className="mx-6 mt-4 max-w-md rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Invite Member</h2>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
          {searchResults.length > 0 && (
            <ul className="space-y-1">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{u.displayName}</span>
                    <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                  </div>
                  <button onClick={() => handleInvite(u.id)} className="text-xs text-blue-600 hover:underline">Add</button>
                </li>
              ))}
            </ul>
          )}
          <h3 className="mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase">Members</h3>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between rounded px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">{m.user.displayName.charAt(0).toUpperCase()}</div>
                  <span className="text-sm text-gray-800">{m.user.displayName}</span>
                  <span className="text-xs text-gray-400">{m.role}</span>
                </div>
                {m.role === "MEMBER" && board.ownerId === user?.id && (
                  <button onClick={() => handleRemove(m.userId)} className="text-xs text-red-500 hover:underline">Remove</button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Columns */}
      <div className="flex flex-1 gap-4 overflow-x-auto p-6">
        {board.columns.map((col) => (
          <div
            key={col.id}
            className="flex w-72 shrink-0 flex-col rounded-lg bg-gray-100 p-3"
            style={col.color ? { backgroundColor: `${col.color}15`, borderTop: `3px solid ${col.color}` } : undefined}
          >
            {editingColId === col.id ? (
              <div className="mb-3 space-y-2">
                <input type="text" value={editColName} onChange={(e) => setEditColName(e.target.value)} maxLength={100} className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
                <div className="flex flex-wrap gap-1">
                  <button onClick={() => setEditColColor(null)} className={`h-6 w-6 rounded border-2 bg-gray-200 ${editColColor === null ? "border-gray-800" : "border-transparent"}`} title="No color" />
                  {PRESET_COLORS.map((c) => (
                    <button key={c} onClick={() => setEditColColor(c)} className={`h-6 w-6 rounded border-2 ${editColColor === c ? "border-gray-800" : "border-transparent"}`} style={{ backgroundColor: c }} />
                  ))}
                </div>
                <input type="text" value={editColColor ?? ""} onChange={(e) => setEditColColor(e.target.value || null)} placeholder="#hex" className="w-full rounded border border-gray-300 px-2 py-1 text-xs focus:border-blue-500 focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdateColumn(col.id)} className="text-xs text-blue-600 hover:underline">Save</button>
                  <button onClick={() => setEditingColId(null)} className="text-xs text-gray-500 hover:underline">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {col.color && <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: col.color }} />}
                  <span className="text-sm font-semibold text-gray-700">{col.name}</span>
                  <span className="text-xs text-gray-400">0</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingColId(col.id); setEditColName(col.name); setEditColColor(col.color); }} className="text-xs text-gray-400 hover:text-blue-600">&#9998;</button>
                  <button onClick={() => handleDeleteColumn(col.id)} className="text-xs text-gray-400 hover:text-red-600">&#128465;</button>
                </div>
              </div>
            )}

            <div className="flex-1">
              <p className="text-center text-xs text-gray-400">No cards yet.</p>
            </div>

            <button className="mt-2 text-left text-sm text-gray-400 hover:text-blue-600">+ New card</button>
          </div>
        ))}

        {showAddColumn ? (
          <form onSubmit={handleAddColumn} className="w-72 shrink-0 rounded-lg border-2 border-dashed border-gray-300 p-3">
            <input type="text" value={newColName} onChange={(e) => setNewColName(e.target.value)} placeholder="Column name" maxLength={100} required className="mb-2 w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
            <div className="flex gap-2">
              <button type="submit" className="rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700">Add</button>
              <button type="button" onClick={() => setShowAddColumn(false)} className="text-xs text-gray-500 hover:underline">Cancel</button>
            </div>
          </form>
        ) : (
          <button onClick={() => setShowAddColumn(true)} className="flex h-12 w-72 shrink-0 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-400 hover:border-blue-400 hover:text-blue-500">+ Add column</button>
        )}
      </div>
    </div>
  );
}
