import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import LearningMode from "./LearningMode.jsx";

export default function ThemeView() {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [showExerciseMode, setShowExerciseMode] = useState(false);
  const { getAuthHeaders } = useAuth();

  // Fonction pour recharger les thèmes avec progression
  const reloadThemes = async () => {
    try {
      const res = await fetch("/api/themes", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setThemes(data);

      // Si un thème est sélectionné, le mettre à jour aussi
      if (selectedTheme) {
        const updatedTheme = data.find(t => t.id === selectedTheme.id);
        if (updatedTheme) {
          await selectTheme(updatedTheme);
        }
      }
    } catch (err) {
      console.error("Erreur rechargement thèmes:", err);
    }
  };

  // Charger les thèmes au démarrage
  useEffect(() => {
    fetch("/api/themes", {
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => setThemes(data))
      .catch((err) => console.error("Erreur chargement thèmes:", err));
  }, [getAuthHeaders]);

  const selectTheme = async (theme) => {
    setSelectedTheme(theme);
    setSelectedPart(null);
    setShowExerciseMode(false);

    // Charger les parties avec leur progression
    if (theme.parts) {
      const partsWithProgress = await Promise.all(
        theme.parts.map(async (part) => {
          try {
            const response = await fetch(`/api/themes/${theme.id}/parts/${part.id}`, {
              headers: getAuthHeaders()
            });
            const data = await response.json();
            return { ...part, progress: data.progress };
          } catch (error) {
            console.error(`Erreur chargement partie ${part.id}:`, error);
            return { ...part, progress: 0 };
          }
        })
      );
      setSelectedTheme({ ...theme, parts: partsWithProgress });
    }
  };

  const selectPart = async (part) => {
    // Recharger la partie avec sa progression complète
    try {
      const response = await fetch(`/api/themes/${selectedTheme.id}/parts/${part.id}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setSelectedPart(data);
    } catch (error) {
      console.error(`Erreur chargement partie ${part.id}:`, error);
      setSelectedPart(part);
    }
    setShowExerciseMode(false);
  };

  const startLearning = (startIndex = 0) => {
    setShowExerciseMode(true);
    setSelectedPart({ ...selectedPart, startIndex });
  };

  if (showExerciseMode && selectedPart) {
    return (
      <LearningMode 
        themeId={selectedTheme.id} 
        partId={selectedPart.id}
        startIndex={selectedPart.startIndex || 0}
        onBack={() => {
          setShowExerciseMode(false);
          // Recharger les thèmes pour mettre à jour la progression
          reloadThemes();
        }} 
      />
    );
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
              {/* Barre de progression du thème */}
              <div className="mt-2 flex items-center text-xs text-gray-500">
                <div className="flex items-center w-full">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full mr-2">
                    <div 
                      className="h-1.5 bg-blue-500 rounded-full transition-all duration-300" 
                      style={{ width: `${theme.progress || 0}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">{theme.progress || 0}%</span>
                </div>
              </div>
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
                      className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                        selectedPart?.id === part.id
                          ? "border-blue-500 bg-blue-50"
                          : part.progress === 100
                          ? "border-green-500 bg-green-100"
                          : "bg-white border-gray-200"
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
                          <div className="text-xs text-gray-500 mb-2">
                            {part.content ? part.content.filter(item => item.type === 'exercise').length : 0} exercice{part.content && part.content.filter(item => item.type === 'exercise').length > 1 ? 's' : ''}, {part.content ? part.content.filter(item => item.type === 'lesson').length : 0} leçon{part.content && part.content.filter(item => item.type === 'lesson').length > 1 ? 's' : ''}
                          </div>
                          {/* Barre de progression de la partie */}
                          <div className="flex items-center text-xs text-gray-500">
                            <span className="mr-2">Progression:</span>
                            <div className="flex items-center flex-1">
                              <div className="flex-1 h-2 bg-gray-200 rounded-full mr-2">
                                <div
                                  className="h-2 bg-green-500 rounded-full transition-all duration-300"
                                  style={{ width: `${part.progress || 0}%` }}
                                ></div>
                              </div>
                              <span className="font-medium">{part.progress || 0}%</span>
                            </div>
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

              {/* Liste des exercices et leçons de la partie sélectionnée */}
              {selectedPart && selectedPart.content && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Exercices et Leçons - {selectedPart.title}
                  </h3>
                  <div className="space-y-3">
                    {selectedPart.content.map((item, index) => {
                      // Vérifier si l'élément est validé
                      const isCompleted = item.type === "lesson"
                        ? selectedPart.lessonProgress?.some(lp => lp.lesson_id === item.id && lp.completed)
                        : selectedPart.exerciseProgress?.some(ep => ep.exercise_id === item.id && ep.completed);

                      return (
                        <div
                          key={item.id}
                          onClick={() => {
                            // Si l'élément est déjà validé, commencer du suivant, sinon de celui-ci
                            let startIndex = index;
                            if (isCompleted) {
                              // Trouver le prochain élément non complété
                              const nextIncomplete = selectedPart.content.findIndex((nextItem, nextIndex) => {
                                if (nextIndex <= index) return false; // Ne pas revenir en arrière
                                const nextCompleted = nextItem.type === "lesson"
                                  ? selectedPart.lessonProgress?.some(lp => lp.lesson_id === nextItem.id && lp.completed)
                                  : selectedPart.exerciseProgress?.some(ep => ep.exercise_id === nextItem.id && ep.completed);
                                return !nextCompleted;
                              });
                              if (nextIncomplete !== -1) {
                                startIndex = nextIncomplete;
                              } else {
                                // Tous les suivants sont complétés, rester sur le dernier
                                startIndex = selectedPart.content.length - 1;
                              }
                            }
                            startLearning(startIndex);
                          }}
                          className={`p-4 rounded-lg border cursor-pointer hover:shadow-md transition-shadow ${
                            isCompleted ? "border-green-500 bg-green-100" : "bg-white border-gray-200 hover:border-blue-300"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center mb-2">
                                <span className={`text-xs px-2 py-1 rounded-full mr-2 ${
                                  item.type === "lesson"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-orange-100 text-orange-800"
                                }`}>
                                  {item.type === "lesson" ? "📖 Leçon" : "💻 Exercice"}
                                </span>
                                <span className="text-sm text-gray-500">
                                  Étape {index + 1}
                                </span>
                                {isCompleted && (
                                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                                    ✓ Validé
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-gray-800">
                                {item.title}
                              </h4>
                              {item.type === "exercise" && item.instructions && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {item.instructions}
                                </p>
                              )}
                              {item.type === "lesson" && item.content && (
                                <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                                  {item.content.substring(0, 100)}...
                                </p>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-2xl">
                                {isCompleted ? "✅" : item.type === "lesson" ? "📖" : "💻"}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Bouton pour commencer les exercices - maintenant sticky en bas */}
            {selectedPart && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 shadow-lg">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {selectedPart.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {selectedPart.content ? selectedPart.content.length : 0} élément{selectedPart.content && selectedPart.content.length > 1 ? 's' : ''} d'apprentissage disponible{selectedPart.content && selectedPart.content.length > 1 ? 's' : ''}
                    </p>
                    {/* Indicateur de progression */}
                    <div className="mt-2 flex items-center text-xs text-gray-500">
                      <span className="mr-2">Progression:</span>
                      <div className="flex items-center">
                        <div className="w-32 h-2 bg-gray-200 rounded-full mr-2">
                          <div className="h-2 bg-green-500 rounded-full" style={{ width: `${selectedPart.progress || 0}%` }}></div>
                        </div>
                        <span>{selectedPart.progress || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      // Trouver le premier élément non complété
                      let startIndex = 0;
                      if (selectedPart.content) {
                        const firstIncomplete = selectedPart.content.findIndex((item) => {
                          if (item.type === 'lesson') {
                            const lessonProgress = selectedPart.lessonProgress || [];
                            return !lessonProgress.some(p => p.lesson_id === item.id && p.completed);
                          } else if (item.type === 'exercise') {
                            const exerciseProgress = selectedPart.exerciseProgress || [];
                            return !exerciseProgress.some(p => p.exercise_id === item.id && p.completed);
                          }
                          return true;
                        });
                        if (firstIncomplete !== -1) {
                          startIndex = firstIncomplete;
                        }
                      }
                      startLearning(startIndex);
                    }}
                    className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center whitespace-nowrap shadow-md"
                  >
                    {selectedPart.progress > 0 ? 'Continuer l\'apprentissage' : 'Commencer l\'apprentissage'}
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
