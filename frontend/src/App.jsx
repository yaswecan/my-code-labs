import { useState } from "react";
import MultiFileEditor from "./MultiFileEditor.jsx";
import ThemeView from "./ThemeView.jsx";

function App() {
  const [mode, setMode] = useState("editor"); // "editor", "themes", or "exercises"

  return (
    <div className="App h-screen overflow-hidden">
      {/* Navigation */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">PHP Learning Platform</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setMode("editor")}
            className={`px-4 py-2 rounded ${
              mode === "editor"
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            Éditeur PHP
          </button>
          <button
            onClick={() => setMode("themes")}
            className={`px-4 py-2 rounded ${
              mode === "themes"
                ? "bg-green-600 hover:bg-green-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            Thèmes d'Apprentissage
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)]">
        {mode === "editor" ? <MultiFileEditor /> : <ThemeView />}
      </div>
    </div>
  );
}

export default App;
