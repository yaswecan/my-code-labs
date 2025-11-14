import { useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import MultiFileEditor from "./MultiFileEditor.jsx";
import ThemeView from "./ThemeView.jsx";
import DatabaseInfo from "./DatabaseInfo.jsx";
import Login from "./Login.jsx";
import Register from "./Register.jsx";

function App() {
  const [mode, setMode] = useState("editor"); // "editor", "themes", "database"
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const { user, logout, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="text-6xl mb-6">📚</div>
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            PHP Learning Platform
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Apprenez PHP de manière interactive
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => setShowLogin(true)}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg"
            >
              Se connecter
            </button>
            <button
              onClick={() => setShowRegister(true)}
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-lg"
            >
              S'inscrire
            </button>
          </div>
        </div>

        {showLogin && (
          <Login
            onClose={() => setShowLogin(false)}
            onSwitchToRegister={() => {
              setShowLogin(false);
              setShowRegister(true);
            }}
          />
        )}

        {showRegister && (
          <Register
            onClose={() => setShowRegister(false)}
            onSwitchToLogin={() => {
              setShowRegister(false);
              setShowLogin(true);
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App h-screen overflow-hidden">
      {/* Navigation */}
      <div className="bg-gray-800 text-white p-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">PHP Learning Platform</h1>
        <div className="flex items-center space-x-4">
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
          <button
            onClick={() => setMode("database")}
            className={`px-4 py-2 rounded ${
              mode === "database"
                ? "bg-purple-600 hover:bg-purple-700"
                : "bg-gray-600 hover:bg-gray-700"
            }`}
          >
            🗄️ Ma Base de Données
          </button>
          <div className="flex items-center space-x-3 ml-4 pl-4 border-l border-gray-600">
            <span className="text-sm">{user.username}</span>
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded text-sm"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-80px)]">
        {mode === "editor" ? (
          <MultiFileEditor />
        ) : mode === "themes" ? (
          <ThemeView />
        ) : (
          <DatabaseInfo />
        )}
      </div>
    </div>
  );
}

export default App;
