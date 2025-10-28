import React, { useState, useEffect } from "react";
import LearningMode from "./LearningMode.jsx";

export default function ThemeView() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showExerciseMode, setShowExerciseMode] = useState(false);

  // Charger les thèmes au démarrage
  useEffect(() => {
    fetch("/api/themes")
      .then((res) => res.json())
      .then((data) => setThemes(data))
      .catch((err) => console.error("Erreur chargement thèmes:", err));
  }, []);

  const selectTheme = (theme) => {
    setSelectedTheme(theme);
    setSelectedPart(null);
    setShowExerciseMode(false);
  };

  const selectPart = (part) => {
    setSelectedPart(part);
    setShowExerciseMode(false);
  };

  const startLearning = () => {
    setShowExerciseMode(true);
  };

  if (showExerciseMode && selectedPart) {
    return <LearningMode themeId={selectedTheme.id} partId={selectedPart.id} onBack={() => setShowExerciseMode(false)} />;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar avec la liste des thèmes */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">📚 Thèmes PHP</h2>
          <p className="text-sm text-gray-600 mt-1">
            Apprenez PHP étape par étape
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => selectTheme(theme)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedTheme?.id === theme.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <h3 className="font-semibold text-gray-800 text-sm">
                {theme.title}
              </h3>
              <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                {theme.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {selectedTheme ? (
          <>
            {/* En-tête du thème */}
            <div className="bg-white border-b border-gray-200 p-4">
              <h1 className="text-2xl font-bold text-gray-800">
                {selectedTheme.title}
              </h1>
              <p className="text-gray-600 mt-1">
                {selectedTheme.description}
              </p>
            </div>

            {/* Liste des parties */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="grid gap-4">
                {selectedTheme.parts
                  .sort((a, b) => a.order - b.order)
                  .map((part) => (
                    <div
                      key={part.id}
                      onClick={() => selectPart(part)}
                      className={`p-4 bg-white rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        selectedPart?.id === part.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center mb-2">
                            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2 py-1 rounded-full mr-2">
                              Partie {part.order}
                            </span>
                            <h3 className="font-semibold text-gray-800">
                              {part.title}
                            </h3>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {part.description}
                          </p>
                          <div className="text-xs text-gray-500">
                            {part.content ? part.content.filter(item => item.type === 'exercise').length : 0} exercice{part.content && part.content.filter(item => item.type === 'exercise').length > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-2xl">
                            {selectedPart?.id === part.id ? "📖" : "📚"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Bouton pour commencer les exercices */}
            {selectedPart && (
              <div className="bg-white border-t border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-800">
                      {selectedPart.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPart.content ? selectedPart.content.filter(item => item.type === 'exercise').length : 0} élément{selectedPart.content && selectedPart.content.filter(item => item.type === 'exercise').length > 1 ? 's' : ''} d'apprentissage disponible{selectedPart.content && selectedPart.content.filter(item => item.type === 'exercise').length > 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    onClick={startLearning}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                  >
                    Commencer l'apprentissage
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          /* Écran d'accueil */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📚</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Thèmes d'Apprentissage PHP
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Choisissez un thème dans la liste à gauche pour commencer votre apprentissage !
              </p>
              <div className="text-sm text-gray-500">
                {themes.length} thème{themes.length > 1 ? 's' : ''} disponible{themes.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
