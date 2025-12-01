# Real-Time Collaborative Notes (ScriptGuru Test)

This repository contains a full-stack MERN implementation of a collaborative notes application. Multiple users can join the same note, edit simultaneously, and watch live updates via WebSockets. The backend persists data in MongoDB (with basic version history) and the frontend is built with Vite + React + Tailwind.

## Features

- Create shareable note rooms (`/note/:id`) without authentication
- Real-time editing powered by Socket.IO
- Auto-save fallback every 6 seconds to guarantee MongoDB persistence
- Note version history with quick restore
- Displays active collaborator count and remote activity indicator
- Responsive UI with autosizing editor and creation form

## Tech Stack

- **Backend:** Node.js, Express, MongoDB, Mongoose, Socket.IO
- **Frontend:** React (Vite), React Router, TailwindCSS, `react-textarea-autosize`, Socket.IO client

## Prerequisites

- Node.js 18+
- MongoDB running locally or a connection string

## Environment Variables

Copy the example env files and adjust as needed:

```bash
cd backend
copy env.example .env

cd ../frontend
copy env.example .env
```

- `backend/.env`
  - `PORT`: Default `5000`
  - `MONGO_URL`: Mongo connection string
  - `CLIENT_URL`: Comma-separated list of allowed origins (e.g. `http://localhost:5173`)
- `frontend/.env`
  - `VITE_API_URL`: Points to the backend REST API
  - `VITE_SOCKET_URL`: Points to the Socket.IO server (usually same as API)

## Getting Started

1. **Install dependencies**

   ```bash
   cd backend
   npm install
   cd ../frontend
   npm install
   ```

2. **Start the backend**

   ```bash
   cd backend
   npm run dev
   ```

3. **Start the frontend**

   ```bash
   cd frontend
   npm run dev
   ```

4. Visit `http://localhost:5173`. Create a note, copy the URL, and open it in another tab to test collaboration.

## Useful Endpoints

- `POST /api/notes` – create a note room
- `GET /api/notes` – list notes
- `GET /api/notes/:id` – fetch a specific note
- `PUT /api/notes/:id` – update content/title (auto-save)
- `GET /api/notes/:id/versions` – fetch version history
- `POST /api/notes/:id/versions/restore` – restore to a previous version

## Testing Checklist

- [ ] Create a note with a custom title
- [ ] Open the note in two tabs and validate live sync
- [ ] Observe active collaborator count updating
- [ ] Confirm auto-save updates “Last updated” timestamp
- [ ] Restore a previous version successfully

## Notes

- Socket CORS supports multiple origins via the `CLIENT_URL` list.
- Version history is capped to the latest 50 entries per note to avoid bloat.
- Tailwind v4 is used with the CSS `@import "tailwindcss";` entry point.

Feel free to extend this project with auth, per-user cursors, or deployments. Contributions welcome!

