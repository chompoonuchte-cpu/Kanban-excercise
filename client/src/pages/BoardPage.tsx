import { useState, useEffect, useRef, type FormEvent, type KeyboardEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { DndContext, DragOverlay, useDroppable, useDraggable, PointerSensor, useSensor, useSensors, type DragStartEvent, type DragEndEvent, type DragOverEvent } from "@dnd-kit/core";
import { useAuth } from "../contexts/AuthContext.tsx";
import { apiFetch, ApiError } from "../lib/api.ts";
import { LABEL_COLORS, LABEL_COLOR_HEX, type LabelColor } from "@kanban/shared";

type PrimaryLabel = { id: string; name: string; color: string } | null;
type CardData = { id: string; title: string; position: number; primaryLabel?: PrimaryLabel };
type ColumnData = { id: string; name: string; color: string | null; position: number; cards: CardData[] };
type BoardData = { id: string; name: string; ownerId: string; columns: ColumnData[] };
type LabelData = { id: string; name: string; color: string; boardId: string };
type CardLabelEntry = { labelId: string; isPrimary: boolean; label: LabelData };
type CardDetail = { id: string; title: string; description: string | null; dueDate: string | null; columnId: string; labels: CardLabelEntry[] };
type MemberEntry = { userId: string; role: "OWNER" | "MEMBER"; user: { id: string; displayName: string; email: string } };
type SearchUser = { id: string; displayName: string; email: string };

const PRESET_COLORS = ["#EF4444", "#F97316", "#EAB308", "#22C55E", "#14B8A6", "#3B82F6", "#6366F1", "#A855F7", "#EC4899", "#6B7280"];

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
  const [addingCardColId, setAddingCardColId] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState("");
  const [drawerCard, setDrawerCard] = useState<CardDetail | null>(null);
  const [drawerTitle, setDrawerTitle] = useState("");
  const [drawerDesc, setDrawerDesc] = useState("");
  const [boardLabels, setBoardLabels] = useState<LabelData[]>([]);
  const [activeCard, setActiveCard] = useState<CardData | null>(null);
  const [error, setError] = useState("");
  const cardInputRef = useRef<HTMLInputElement>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  async function loadBoard() {
    const data = await apiFetch<BoardData>(`/boards/${id}`);
    setBoard(data);
  }

  async function loadLabels() {
    const labels = await apiFetch<LabelData[]>(`/boards/${id}/labels`);
    setBoardLabels(labels);
  }

  useEffect(() => { loadBoard(); apiFetch<MemberEntry[]>(`/boards/${id}/members`).then(setMembers); loadLabels(); }, [id]);

  useEffect(() => {
    if (searchQuery.length < 2) { setSearchResults([]); return; }
    const timeout = setTimeout(() => {
      apiFetch<SearchUser[]>(`/users/search?q=${encodeURIComponent(searchQuery)}`).then(
        (users) => { const ids = new Set(members.map((m) => m.userId)); setSearchResults(users.filter((u) => !ids.has(u.id))); },
      );
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, members]);

  async function handleInvite(userId: string) {
    setError("");
    try {
      await apiFetch(`/boards/${id}/members`, { method: "POST", body: JSON.stringify({ userId }) });
      setMembers(await apiFetch<MemberEntry[]>(`/boards/${id}/members`));
      setSearchQuery(""); setSearchResults([]);
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed"); }
  }

  async function handleRemove(userId: string) {
    await apiFetch(`/boards/${id}/members/${userId}`, { method: "DELETE" });
    setMembers((prev) => prev.filter((m) => m.userId !== userId));
  }

  async function handleAddColumn(e: FormEvent) {
    e.preventDefault(); setError("");
    try {
      await apiFetch(`/boards/${id}/columns`, { method: "POST", body: JSON.stringify({ name: newColName }) });
      setNewColName(""); setShowAddColumn(false); await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed"); }
  }

  async function handleUpdateColumn(colId: string) {
    setError("");
    try {
      await apiFetch(`/columns/${colId}`, { method: "PATCH", body: JSON.stringify({ name: editColName, color: editColColor }) });
      setEditingColId(null); await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed"); }
  }

  async function handleDeleteColumn(colId: string) {
    try { await apiFetch(`/columns/${colId}`, { method: "DELETE" }); await loadBoard(); } catch {}
  }

  async function handleCreateCard(columnId: string) {
    if (!newCardTitle.trim()) return;
    setError("");
    try {
      await apiFetch(`/columns/${columnId}/cards`, { method: "POST", body: JSON.stringify({ title: newCardTitle }) });
      setNewCardTitle(""); setAddingCardColId(null); await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed"); }
  }

  function handleCardInputKey(e: KeyboardEvent, columnId: string) {
    if (e.key === "Enter") { e.preventDefault(); handleCreateCard(columnId); }
    if (e.key === "Escape") { setAddingCardColId(null); setNewCardTitle(""); }
  }

  async function openDrawer(cardId: string) {
    const card = await apiFetch<CardDetail>(`/cards/${cardId}`);
    setDrawerCard(card);
    setDrawerTitle(card.title);
    setDrawerDesc(card.description ?? "");
  }

  async function saveDrawer() {
    if (!drawerCard) return;
    try {
      const updated = await apiFetch<CardDetail>(`/cards/${drawerCard.id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: drawerTitle, description: drawerDesc || null }),
      });
      setDrawerCard(updated);
      await loadBoard();
    } catch (err) { setError(err instanceof ApiError ? err.message : "Failed"); }
  }

  async function deleteCardFromDrawer() {
    if (!drawerCard) return;
    await apiFetch(`/cards/${drawerCard.id}`, { method: "DELETE" });
    setDrawerCard(null);
    await loadBoard();
  }

  function handleDragStart(event: DragStartEvent) {
    if (!board) return;
    const cardId = event.active.id as string;
    for (const col of board.columns) {
      const card = col.cards.find((c) => c.id === cardId);
      if (card) { setActiveCard(card); return; }
    }
  }

  function handleDragOver(event: DragOverEvent) {
    if (!board || !event.over) return;
    const cardId = event.active.id as string;
    const overId = event.over.id as string;

    let sourceColId: string | null = null;
    let targetColId: string | null = null;

    for (const col of board.columns) {
      if (col.cards.some((c) => c.id === cardId)) sourceColId = col.id;
      if (col.id === overId || col.cards.some((c) => c.id === overId)) targetColId = col.id === overId ? col.id : col.id;
    }

    if (sourceColId && targetColId && sourceColId !== targetColId) {
      setBoard((prev) => {
        if (!prev) return prev;
        const cols = prev.columns.map((col) => ({ ...col, cards: [...col.cards] }));
        const srcCol = cols.find((c) => c.id === sourceColId)!;
        const dstCol = cols.find((c) => c.id === targetColId)!;
        const cardIdx = srcCol.cards.findIndex((c) => c.id === cardId);
        if (cardIdx === -1) return prev;
        const [card] = srcCol.cards.splice(cardIdx, 1);
        dstCol.cards.push(card);
        return { ...prev, columns: cols };
      });
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveCard(null);
    if (!board || !event.over) return;
    const cardId = event.active.id as string;
    const overId = event.over.id as string;

    let targetCol: ColumnData | null = null;
    for (const col of board.columns) {
      if (col.id === overId || col.cards.some((c) => c.id === overId)) {
        targetCol = col;
        break;
      }
    }
    if (!targetCol) return;

    const cardsInTarget = targetCol.cards.filter((c) => c.id !== cardId);
    const overCardIdx = cardsInTarget.findIndex((c) => c.id === overId);

    let newPosition: number;
    if (overId === targetCol.id || cardsInTarget.length === 0) {
      const last = cardsInTarget[cardsInTarget.length - 1];
      newPosition = last ? last.position + 1024 : 1024;
    } else if (overCardIdx === 0) {
      newPosition = cardsInTarget[0].position / 2;
    } else if (overCardIdx === -1) {
      const last = cardsInTarget[cardsInTarget.length - 1];
      newPosition = last ? last.position + 1024 : 1024;
    } else {
      newPosition = (cardsInTarget[overCardIdx - 1].position + cardsInTarget[overCardIdx].position) / 2;
    }

    try {
      await apiFetch(`/cards/${cardId}/move`, {
        method: "PATCH",
        body: JSON.stringify({ columnId: targetCol.id, position: newPosition }),
      });
      await loadBoard();
    } catch {}
  }

  if (!board) return null;

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* Header */}
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

      {/* Invite panel */}
      {showInvite && (
        <div className="mx-6 mt-4 max-w-md rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 text-sm font-semibold text-gray-700">Invite Member</h2>
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search by name or email..." className="mb-2 w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
          {searchResults.length > 0 && (
            <ul className="space-y-1">{searchResults.map((u) => (
              <li key={u.id} className="flex items-center justify-between rounded px-2 py-1.5 hover:bg-gray-50">
                <div><span className="text-sm font-medium text-gray-800">{u.displayName}</span><span className="ml-2 text-xs text-gray-400">{u.email}</span></div>
                <button onClick={() => handleInvite(u.id)} className="text-xs text-blue-600 hover:underline">Add</button>
              </li>
            ))}</ul>
          )}
          <h3 className="mt-4 mb-2 text-xs font-semibold text-gray-500 uppercase">Members</h3>
          <ul className="space-y-1">{members.map((m) => (
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
          ))}</ul>
        </div>
      )}

      {/* Columns */}
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
        <div className="flex flex-1 gap-4 overflow-x-auto p-6">
          {board.columns.map((col) => (
            <DroppableColumn key={col.id} col={col}>
              {editingColId === col.id ? (
                <div className="mb-3 space-y-2">
                  <input type="text" value={editColName} onChange={(e) => setEditColName(e.target.value)} maxLength={100} className="w-full rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
                  <div className="flex flex-wrap gap-1">
                    <button onClick={() => setEditColColor(null)} className={`h-6 w-6 rounded border-2 bg-gray-200 ${editColColor === null ? "border-gray-800" : "border-transparent"}`} title="No color" />
                    {PRESET_COLORS.map((c) => (<button key={c} onClick={() => setEditColColor(c)} className={`h-6 w-6 rounded border-2 ${editColColor === c ? "border-gray-800" : "border-transparent"}`} style={{ backgroundColor: c }} />))}
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
                    <span className="text-xs text-gray-400">{col.cards.length}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingColId(col.id); setEditColName(col.name); setEditColColor(col.color); }} className="text-xs text-gray-400 hover:text-blue-600">&#9998;</button>
                    <button onClick={() => handleDeleteColumn(col.id)} className="text-xs text-gray-400 hover:text-red-600">&#128465;</button>
                  </div>
                </div>
              )}

              <div className="flex-1 space-y-2">
                {col.cards.length === 0 && addingCardColId !== col.id && (
                  <p className="text-center text-xs text-gray-400">No cards yet.</p>
                )}
                {col.cards.map((card) => (
                  <DraggableCard key={card.id} card={card} onClick={() => openDrawer(card.id)} />
                ))}
              </div>

              {addingCardColId === col.id ? (
                <div className="mt-2">
                  <input ref={cardInputRef} type="text" value={newCardTitle} onChange={(e) => setNewCardTitle(e.target.value)} onKeyDown={(e) => handleCardInputKey(e, col.id)} onBlur={() => { if (!newCardTitle.trim()) { setAddingCardColId(null); } }} placeholder="Card title..." maxLength={255} className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none" autoFocus />
                </div>
              ) : (
                <button onClick={() => { setAddingCardColId(col.id); setNewCardTitle(""); }} className="mt-2 text-left text-sm text-gray-400 hover:text-blue-600">+ New card</button>
              )}
            </DroppableColumn>
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

        <DragOverlay>
          {activeCard && (
            <div className="w-72 rounded-lg bg-white p-3 shadow-lg opacity-90">
              <p className="text-sm font-medium text-gray-800">{activeCard.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Side Drawer */}
      {drawerCard && (
        <>
          <div className="fixed inset-0 z-40 bg-black/20" onClick={() => { saveDrawer(); setDrawerCard(null); }} />
          <div className="fixed right-0 top-0 z-50 flex h-full w-96 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-bold text-gray-800">Card Detail</h2>
              <button onClick={() => { saveDrawer(); setDrawerCard(null); }} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Title</label>
                <input
                  type="text"
                  value={drawerTitle}
                  onChange={(e) => setDrawerTitle(e.target.value)}
                  onBlur={saveDrawer}
                  maxLength={255}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Description</label>
                <textarea
                  value={drawerDesc}
                  onChange={(e) => setDrawerDesc(e.target.value)}
                  onBlur={saveDrawer}
                  maxLength={5000}
                  rows={6}
                  placeholder="Add a description..."
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none resize-none"
                />
                <p className="text-right text-xs text-gray-400">{drawerDesc.length}/5000</p>
              </div>
              {/* Labels */}
              <div>
                <label className="mb-1 block text-xs font-semibold text-gray-500 uppercase">Labels</label>
                <div className="space-y-1">
                  {drawerCard.labels.map((cl) => (
                    <div key={cl.labelId} className="flex items-center justify-between rounded px-2 py-1 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: LABEL_COLOR_HEX[cl.label.color as LabelColor] ?? "#6B7280" }} />
                        <span>{cl.label.name}</span>
                        {cl.isPrimary && <span className="text-[10px] text-blue-600 font-bold">PRIMARY</span>}
                      </div>
                      <div className="flex gap-2">
                        {!cl.isPrimary && (
                          <button onClick={async () => {
                            await apiFetch(`/cards/${drawerCard.id}/labels/${cl.labelId}/primary`, { method: "PATCH", body: JSON.stringify({ isPrimary: true }) });
                            const updated = await apiFetch<CardDetail>(`/cards/${drawerCard.id}`);
                            setDrawerCard(updated);
                            await loadBoard();
                          }} className="text-[10px] text-blue-600 hover:underline">Set primary</button>
                        )}
                        <button onClick={async () => {
                          await apiFetch(`/cards/${drawerCard.id}/labels/${cl.labelId}`, { method: "DELETE" });
                          const updated = await apiFetch<CardDetail>(`/cards/${drawerCard.id}`);
                          setDrawerCard(updated);
                          await loadBoard();
                        }} className="text-[10px] text-red-500 hover:underline">Remove</button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-400 mb-1">Add label:</p>
                  <div className="flex flex-wrap gap-1">
                    {boardLabels.filter((bl) => !drawerCard.labels.some((cl) => cl.labelId === bl.id)).map((bl) => (
                      <button key={bl.id} onClick={async () => {
                        await apiFetch(`/cards/${drawerCard.id}/labels`, { method: "POST", body: JSON.stringify({ labelId: bl.id }) });
                        const updated = await apiFetch<CardDetail>(`/cards/${drawerCard.id}`);
                        setDrawerCard(updated);
                        await loadBoard();
                      }} className="flex items-center gap-1 rounded border border-gray-200 px-2 py-0.5 text-xs hover:bg-gray-50">
                        <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: LABEL_COLOR_HEX[bl.color as LabelColor] ?? "#6B7280" }} />
                        {bl.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4">
              <button onClick={deleteCardFromDrawer} className="text-sm text-red-600 hover:underline">Delete Card</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function DroppableColumn({ col, children }: { col: ColumnData; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: col.id });
  return (
    <div
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg p-3 transition-colors ${isOver ? "bg-blue-50" : "bg-gray-100"}`}
      style={col.color ? { backgroundColor: isOver ? `${col.color}25` : `${col.color}15`, borderTop: `3px solid ${col.color}` } : undefined}
    >
      {children}
    </div>
  );
}

function DraggableCard({ card, onClick }: { card: CardData; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: card.id });
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={`w-full rounded-lg bg-white p-3 text-left shadow-sm hover:shadow transition-shadow ${isDragging ? "opacity-30" : ""}`}
    >
      {card.primaryLabel && (
        <span className="mb-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-bold uppercase text-white" style={{ backgroundColor: LABEL_COLOR_HEX[card.primaryLabel.color as LabelColor] ?? card.primaryLabel.color }}>
          {card.primaryLabel.name}
        </span>
      )}
      <p className="text-sm font-medium text-gray-800">{card.title}</p>
    </button>
  );
}
