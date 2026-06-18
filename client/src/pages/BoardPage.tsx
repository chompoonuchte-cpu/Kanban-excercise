import { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { apiFetch, ApiError } from "../lib/api.ts";

type Board = { id: string; name: string; ownerId: string };
type MemberEntry = {
  userId: string;
  role: "OWNER" | "MEMBER";
  user: { id: string; displayName: string; email: string };
};
type SearchUser = { id: string; displayName: string; email: string };

export default function BoardPage() {
  const { id } = useParams();
  const { user, logout } = useAuth();
  const [board, setBoard] = useState<Board | null>(null);
  const [members, setMembers] = useState<MemberEntry[]>([]);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Board>(`/boards/${id}`).then(setBoard);
    apiFetch<MemberEntry[]>(`/boards/${id}/members`).then(setMembers);
  }, [id]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }
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
      await apiFetch(`/boards/${id}/members`, {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      const updated = await apiFetch<MemberEntry[]>(`/boards/${id}/members`);
      setMembers(updated);
      setSearchQuery("");
      setSearchResults([]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invite");
    }
  }

  async function handleRemove(userId: string) {
    await apiFetch(`/boards/${id}/members/${userId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  if (!board) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-3">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-sm text-gray-500 hover:underline">
            &larr; Boards
          </Link>
          <h1 className="text-lg font-bold text-gray-800">{board.name}</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
          >
            + Invite
          </button>
          <Link to="/profile" className="text-sm text-gray-500 hover:underline">
            {user?.displayName}
          </Link>
          <button onClick={logout} className="text-sm text-gray-500 hover:underline">
            Logout
          </button>
        </div>
      </header>

      {error && (
        <div className="mx-6 mt-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
      )}

      {showInvite && (
        <div className="mx-6 mt-4 max-w-md rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Invite Member</h2>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            autoFocus
          />
          {searchResults.length > 0 && (
            <ul className="space-y-1">
              {searchResults.map((u) => (
                <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                  <div>
                    <span className="text-sm font-medium text-gray-800">{u.displayName}</span>
                    <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                  </div>
                  <button
                    onClick={() => handleInvite(u.id)}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Add
                  </button>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase">Members</h3>
          <ul className="space-y-1">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between rounded px-2 py-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gray-300 text-xs font-bold text-white">
                    {m.user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-gray-800">{m.user.displayName}</span>
                  <span className="text-xs text-gray-400">{m.role}</span>
                </div>
                {m.role === "MEMBER" && board.ownerId === user?.id && (
                  <button
                    onClick={() => handleRemove(m.userId)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="p-6">
        <p className="text-gray-500">Columns and cards coming soon.</p>
      </div>
    </div>
  );
}
