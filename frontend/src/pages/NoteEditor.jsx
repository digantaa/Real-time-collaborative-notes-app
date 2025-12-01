import { useCallback, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import TextareaAutosize from "react-textarea-autosize";
import api from "../api";
import { useNavigate, useParams } from "react-router-dom";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL?.replace(/\/$/, "") || "http://localhost:5000";
const SAVE_INTERVAL_MS = 6000;

export default function NoteEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [noteId, setNoteId] = useState(id);
  const [title, setTitle] = useState("Untitled Note");
  const [content, setContent] = useState("");
  const [activeUsers, setActiveUsers] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [versions, setVersions] = useState([]);
  const [remoteCursors, setRemoteCursors] = useState({});
  const textareaRef = useRef(null);
  const socket = useRef(null);
  const lastSyncedRef = useRef({ title: "", content: "" });

  useEffect(() => {
    setNoteId(id);
  }, [id]);

  const loadVersions = useCallback(
    async (targetId = noteId) => {
      if (!targetId) return;
      try {
        const res = await api.get(`/api/notes/${targetId}/versions`);
        setVersions(res.data.slice(0, 5));
      } catch (err) {
        console.warn("Could not load versions", err);
      }
    },
    [noteId]
  );

  useEffect(() => {
    if (!noteId) return;
    let ignore = false;

    const fetchNote = async () => {
      try {
        const res = await api.get(`/api/notes/${noteId}`);
        if (ignore) return;
        setTitle(res.data.title ?? "Untitled Note");
        setContent(res.data.content ?? "");
        setLastUpdated(res.data.updatedAt ?? null);
        lastSyncedRef.current = {
          title: res.data.title ?? "Untitled Note",
          content: res.data.content ?? "",
        };
        await loadVersions(res.data._id);
      } catch (err) {
      
        const newNote = await api.post("/api/notes", { title: "Untitled Note" });
        if (ignore) return;
        setNoteId(newNote.data._id);
        setTitle(newNote.data.title);
        setContent(newNote.data.content ?? "");
        lastSyncedRef.current = {
          title: newNote.data.title ?? "Untitled Note",
          content: newNote.data.content ?? "",
        };
        navigate(`/note/${newNote.data._id}`, { replace: true });
        await loadVersions(newNote.data._id);
      }
    };

    fetchNote();

    return () => {
      ignore = true;
    };
  }, [noteId, navigate, loadVersions]);

  useEffect(() => {
    if (!noteId) return;
    socket.current = io(SOCKET_URL);
    socket.current.emit("join_note", { noteId });
    socket.current.on("note_update", (updatedContent) => {
      setContent(updatedContent);
    });
    socket.current.on("last_saved", (timestamp) => {
      setLastUpdated(timestamp);
      setIsSaving(false);
    });
    socket.current.on("active_users", (count) => setActiveUsers(count));
    socket.current.on("cursor_position", ({ userId, cursor }) => {
      setRemoteCursors((prev) => ({
        ...prev,
        [userId]: { cursor, timestamp: Date.now() },
      }));
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [noteId]);

  useEffect(() => {
    if (!noteId) return;
    const hasChanged =
      lastSyncedRef.current.title !== title ||
      lastSyncedRef.current.content !== content;
    if (!hasChanged) return;

    const timeout = setTimeout(async () => {
      setIsSaving(true);
      try {
        const res = await api.put(`/api/notes/${noteId}`, {
          title,
          content,
        });
        setLastUpdated(res.data.updatedAt);
        lastSyncedRef.current = {
          title: res.data.title ?? title,
          content: res.data.content ?? content,
        };
        await loadVersions();
      } catch (err) {
        console.error("Autosave failed", err);
      } finally {
        setIsSaving(false);
      }
    }, SAVE_INTERVAL_MS);

    return () => clearTimeout(timeout);
  }, [noteId, title, content, loadVersions]);

  useEffect(() => {
    const cleanup = setInterval(() => {
      setRemoteCursors((prev) => {
        const now = Date.now();
        const filteredEntries = Object.entries(prev).filter(
          ([, value]) => now - value.timestamp < 8000
        );
        return Object.fromEntries(filteredEntries);
      });
    }, 5000);

    return () => clearInterval(cleanup);
  }, []);

  const handleContentChange = (e) => {
    const value = e.target.value;
    setContent(value);
    socket.current?.emit("note_update", { noteId, content: value });
  };

  const handleCursor = (e) => {
    socket.current?.emit("cursor_position", {
      noteId,
      cursor: e.target.selectionStart,
    });
  };

  const handleTitleChange = (e) => {
    setTitle(e.target.value);
  };

  const restoreVersion = async (timestamp) => {
    try {
      const res = await api.post(`/api/notes/${noteId}/versions/restore`, {
        timestamp,
      });
      setContent(res.data.content);
      setLastUpdated(res.data.updatedAt);
      lastSyncedRef.current = {
        title: res.data.title ?? title,
        content: res.data.content ?? "",
      };
      await loadVersions();
    } catch (err) {
      console.error("Failed to restore version", err);
    }
  };

  const lastUpdatedLabel = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString()
    : "Never";

  return (
    <div className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-2 rounded border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <input
            value={title}
            onChange={handleTitleChange}
            className="w-full rounded border px-3 py-2 text-xl font-semibold focus:border-blue-500 focus:outline-none"
          />
          <div className="text-sm text-gray-500">
            Active collaborators: {activeUsers}
          </div>
        </div>
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdatedLabel} {isSaving && "(saving...)"}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <div className="flex flex-col rounded border bg-white p-4 shadow-sm">
          <TextareaAutosize
            minRows={16}
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onSelect={handleCursor}
            className="w-full flex-1 resize-none rounded border px-3 py-2 text-base focus:border-blue-500 focus:outline-none"
            placeholder="Start typing and share this URL with collaborators..."
          />
          {Object.keys(remoteCursors).length > 0 && (
            <p className="mt-3 text-xs text-green-700">
              Collaborators are active in this note.
            </p>
          )}
        </div>

        <aside className="rounded border bg-white p-4 shadow-sm">
          <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            Version History
          </h3>
          {versions.length === 0 && (
            <p className="text-sm text-gray-500">
              Versions appear every time auto-save runs.
            </p>
          )}
          <ul className="space-y-2">
            {versions.map((version) => (
              <li
                key={version.timestamp}
                className="flex items-center justify-between rounded border px-3 py-2 text-sm"
              >
                <span>{new Date(version.timestamp).toLocaleString()}</span>
                <button
                  onClick={() => restoreVersion(version.timestamp)}
                  className="text-blue-600 hover:underline"
                >
                  Restore
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </div>
  );
}
