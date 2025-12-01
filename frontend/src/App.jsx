import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import NoteList from "./pages/NoteList.jsx";
import NoteEditor from "./pages/NoteEditor.jsx";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<NoteList />} />
        <Route path="/note/:id" element={<NoteEditor />} />
      </Routes>
    </Router>
  );
}

export default App;
