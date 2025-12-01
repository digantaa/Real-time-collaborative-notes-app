import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";

export default function NotesList() {
  const [notes, setNotes] = useState([]);
  const [newTitle, setNewTitle] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const res = await api.get("/api/notes");
      setNotes(res.data);
    } catch (err) {
      console.error("Failed to fetch notes", err);
    }
  };

  const createNote = async (e) => {
    e.preventDefault();
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await api.post("/api/notes", {
        title: newTitle.trim() || "Untitled Note",
      });
      setNewTitle("");
      await fetchNotes();
      navigate(`/note/${res.data._id}`);
    } catch (err) {
      console.error("Failed to create note", err);
    } finally {
      setIsCreating(false);
    }
  };

  const formatDate = (date) =>
    date ? new Date(date).toLocaleString() : "Never";

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 p-6">
      <header className="rounded border bg-white p-4 shadow-sm">
        <h1 className="text-2xl font-semibold">Collaborative Notes</h1>
        <p className="text-sm text-gray-600">
          Create a note room, share the URL, and collaborate in real-time.
        </p>
      </header>

      <section className="rounded border bg-white p-4 shadow-sm">
        <form onSubmit={createNote} className="flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            placeholder="Enter a title for your new note"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="flex-1 rounded border px-3 py-2 focus:border-blue-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={isCreating}
            className="rounded bg-blue-600 px-4 py-2 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-75"
          >
            {isCreating ? "Creating..." : "Create & Collaborate"}
          </button>
        </form>
      </section>

      <section className="rounded border bg-white p-4 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold">Recent Notes</h2>
        {notes.length === 0 && (
          <p className="text-sm text-gray-500">No notes yet. Create one!</p>
        )}
        <ul className="divide-y">
          {notes.map((note) => (
            <li
              key={note._id}
              className="cursor-pointer py-3 hover:bg-gray-50"
              onClick={() => navigate(`/note/${note._id}`)}
            >
              <p className="font-medium">
                {note.title?.trim() || "Untitled Note"}
              </p>
              <p className="text-xs text-gray-500">
                Last updated: {formatDate(note.updatedAt)}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
