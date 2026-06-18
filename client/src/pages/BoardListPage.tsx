import { useState, useEffect, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.tsx";
import { apiFetch, ApiError } from "../lib/api.ts";

type Board = {
  id: string;
  name: string;
  ownerId: string;
};

export default function BoardListPage() {
  const { user, logout } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<Board[]>("/boards").then(setBoards);
  }, []);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const board = await apiFetch<Board>("/boards", {
        method: "POST",
        body: JSON.stringify({ name: newName }),
      });
      setBoards((prev) => [board, ...prev]);
      setNewName("");
      setShowCreate(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create board");
    }
  }

  async function handleRename(id: string) {
    setError("");
    try {
      const updated = await apiFetch<Board>(`/boards/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName }),
      });
      setBoards((prev) => prev.map((b) => (b.id === id ? updated : b)));
      setEditingId(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to rename board");
    }
  }

  async function handleDelete(id: string) {
    setError("");
    try {
      await apiFetch(`/boards/${id}`, { method: "DELETE" });
      setBoards((prev) => prev.filter((b) => b.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete board");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-800">Boards</h1>
          <div className="flex items-center gap-3">
            <Link to="/profile" className="text-sm text-gray-500 hover:underline">
              {user?.displayName}
            </Link>
            <button
              onClick={logout}
              className="text-sm text-gray-500 hover:underline"
            >
              Logout
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-50 p-3 text-sm text-red-600">{error}</div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="rounded-lg bg-white p-5 shadow hover:shadow-md transition-shadow"
            >
              {editingId === board.id ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRename(board.id);
                  }}
                  className="space-y-2"
                >
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="text-xs text-blue-600 hover:underline">
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="text-xs text-gray-500 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <Link to={`/boards/${board.id}`} className="block">
                    <h2 className="text-lg font-semibold text-gray-800">{board.name}</h2>
                    {board.ownerId === user?.id && (
                      <span className="mt-1 inline-block text-xs text-gray-400">Owner</span>
                    )}
                  </Link>
                  {board.ownerId === user?.id && (
                    <div className="mt-3 flex gap-3">
                      <button
                        onClick={() => {
                          setEditingId(board.id);
                          setEditName(board.name);
                        }}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => handleDelete(board.id)}
                        className="text-xs text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          ))}

          {showCreate ? (
            <form
              onSubmit={handleCreate}
              className="rounded-lg border-2 border-dashed border-gray-300 p-5"
            >
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Board name"
                maxLength={100}
                required
                className="mb-3 w-full rounded border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-700"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700 hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg border-2 border-dashed border-gray-300 p-5 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
            >
              + Create Board
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
