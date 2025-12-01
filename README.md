# RealTime Notes App

A web-based **real-time collaborative notes application** built with React.js, Node.js, Express.js, MongoDB, and Socket.io. Users can create, edit, and collaborate on notes instantly, with live updates and active user tracking.

---

## Features

- **Create, Edit, Delete Notes** – Simple interface to manage your notes.  
- **Real-Time Collaboration** – Multiple users can edit the same note simultaneously.  
- **Active Users Tracking** – See how many users are currently editing a note.  
- **Version History** – Restore previous versions of your notes.  
- **Responsive UI** – Built with Tailwind CSS for a modern look.  

---

## Tech Stack

- **Frontend:** React.js, Tailwind CSS, React Router  
- **Backend:** Node.js, Express.js  
- **Database:** MongoDB  
- **Real-time Communication:** Socket.io  
- **Environment Variables:** `.env` file with `MONGO_URL`, `CLIENT_URL`, and `PORT`  

---

## Demo

*(Optional: Add screenshots or GIFs of your app here to showcase the interface.)*

---

## Installation

### Backend

1. Navigate to the backend folder:
cd backend
Install dependencies:
npm install

Create a .env file with the following variables:
MONGO_URL=your_mongodb_connection_string
CLIENT_URL=http://localhost:5173
PORT=5000

Start the backend server:
npm run dev


Navigate to the frontend folder:
cd frontend

Install dependencies:
npm install

Start the frontend:
npm run dev
The app will be accessible at http://localhost:5173.




