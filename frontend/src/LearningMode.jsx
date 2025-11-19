import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";
import Editor from "@monaco-editor/react";

export default function LearningMode({ themeId, partId, onBack, startIndex = 0 }) {
  const [part, setPart] = useState(null);
  const { getAuthHeaders } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [lessonAnswer, setLessonAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState(null);
  const [lessonResult, setLessonResult] = useState(null);
  const [code, setCode] = useState("");
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Fonction pour recharger la progression
  const reloadProgress = async () => {
    try {
      const res = await fetch(`/api/themes/${themeId}/parts/${partId}`, {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setPart(data);
    } catch (err) {
      console.error("Erreur rechargement progression:", err);
    }
  };

  // Charger le contenu de la partie
  useEffect(() => {
    fetch(`/api/themes/${themeId}/parts/${partId}`, {
      headers: getAuthHeaders()
    })
      .then((res) => res.json())
      .then((data) => {
        setPart(data);
        // Initialiser avec l'élément au startIndex
        if (data.content && data.content.length > 0) {
          const itemToStart = data.content[startIndex] || data.content[0];
          setCurrentIndex(startIndex);
          if (itemToStart.type === "exercise") {
            initializeExercise(itemToStart);
          }
        }
      })
      .catch((err) => console.error("Erreur chargement partie:", err));
  }, [themeId, partId, getAuthHeaders, startIndex]);

  const initializeExercise = (exercise) => {
    if (exercise.files) {
      // Exercice multi-fichiers
      setFiles(exercise.files.map((file, index) => ({
        id: index + 1,
        name: file.name,
        content: file.content,
        language: file.name.endsWith('.css') ? 'css' : file.name.endsWith('.js') ? 'javascript' : 'php'
      })));
      setActiveFileId(1);
      setCode(exercise.files[0].content);
    } else {
      // Exercice simple
      setFiles([]);
      setCode(exercise.initialCode || "");
    }
    setTestResult(null);
  };

  const currentItem = part?.content?.[currentIndex];
  const isLastItem = currentIndex === (part?.content?.length - 1);

  const nextItem = () => {
    if (isLastItem) {
      onBack(); // Retourner à la vue des thèmes
    } else {
      setCurrentIndex(currentIndex + 1);
      setLessonAnswer("");
      setSelectedOption(null);
      setLessonResult(null);

      const nextItem = part.content[currentIndex + 1];
      if (nextItem.type === "exercise") {
        initializeExercise(nextItem);
      }
    }
  };

  const testLesson = async () => {
    if (!currentItem) return;

    const answer = currentItem.testType === "mcq" ? selectedOption : lessonAnswer.trim();
    if (currentItem.testType === "mcq" && selectedOption === null) return;
    if (currentItem.testType === "text" && !lessonAnswer.trim()) return;

    try {
      const res = await fetch("/api/test-lesson", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          lessonId: currentItem.id,
          answer: answer
        }),
      });

      const result = await res.json();
      setLessonResult(result);

      // Si la leçon est validée, recharger la progression
      if (result.passed) {
        await reloadProgress();
      }
    } catch (error) {
      setLessonResult({
        passed: false,
        message: "❌ Erreur de connexion: " + error.message,
        correct: false
      });
    }
  };

  const testExercise = async () => {
    if (!currentItem) return;

    setIsTesting(true);
    try {
      const payload = {
        exerciseId: currentItem.id,
        code: files.length > 0 ? "" : code,
        files: files.length > 0 ? files.map(f => ({ name: f.name, content: f.content })) : null
      };

      const res = await fetch("/api/test-exercise", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...getAuthHeaders()
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      setTestResult(result);

      // Si l'exercice est validé, recharger la progression
      if (result.passed) {
        await reloadProgress();
      }
    } catch (error) {
      setTestResult({
        passed: false,
        message: "❌ Erreur de connexion: " + error.message,
        details: { error: error.message }
      });
    } finally {
      setIsTesting(false);
    }
  };

  const updateFileContent = (content) => {
    if (files.length > 0) {
      setFiles(files.map(f =>
        f.id === activeFileId ? { ...f, content } : f
      ));
    } else {
      setCode(content);
    }
  };

  const activeFile = files.find(f => f.id === activeFileId);

  if (!part) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p>Chargement de la partie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar avec la progression */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-800">  Apprentissage</h2>
              <p className="text-sm text-gray-600 mt-1">
                {part.title}
              </p>
            </div>
            <button
              onClick={onBack}
              className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm"
            >
              ← Retour
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            {part.content.map((item, index) => {
              // Vérifier si l'élément est validé (leçon ou exercice)
              const isCompleted = item.type === "lesson"
                ? part.lessonProgress?.some(lp => lp.lesson_id === item.id && lp.completed)
                : part.exerciseProgress?.some(ep => ep.exercise_id === item.id && ep.completed);

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-lg border ${
                    isCompleted
                      ? "border-green-500 bg-green-200"
                      : index === currentIndex
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mr-3 ${
                      isCompleted
                        ? "bg-green-500 text-white"
                        : index === currentIndex
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-gray-600"
                    }`}>
                      {isCompleted ? "✓" : index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <span className={`text-xs px-2 py-1 rounded-full mr-2 ${
                          item.type === "lesson"
                            ? "bg-purple-100 text-purple-800"
                            : "bg-orange-100 text-orange-800"
                        }`}>
                          {item.type === "lesson" ? "📖 Leçon" : "💻 Exercice"}
                        </span>
                      </div>
                      <h4 className="font-medium text-gray-800 text-sm">
                        {item.title}
                      </h4>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {currentItem && (
          <>
            {/* En-tête de l'élément actuel */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center mb-2">
                    <span className={`text-sm px-3 py-1 rounded-full mr-3 ${
                      currentItem.type === "lesson"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-orange-100 text-orange-800"
                    }`}>
                      {currentItem.type === "lesson" ? "📖 Leçon" : "💻 Exercice"}
                    </span>
                    <span className="text-sm text-gray-500">
                      Étape {currentIndex + 1} sur {part.content.length}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {currentItem.title}
                  </h1>
                </div>
                <div className="flex items-center space-x-3">
                  {currentItem.type === "lesson" && lessonResult?.passed && (
                    <button
                      onClick={nextItem}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                    >
                      {isLastItem ? "Terminer" : "Suivant →"}
                    </button>
                  )}
                  {currentItem.type === "exercise" && testResult?.passed && (
                    <button
                      onClick={nextItem}
                      className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold"
                    >
                      {isLastItem ? "Terminer" : "Suivant →"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Contenu de l'élément */}
            <div className="flex-1 overflow-y-auto">
              {currentItem.type === "lesson" ? (
                /* Affichage d'une leçon */
                <div className="p-6">
                  <div className="max-w-4xl mx-auto">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                      <div className="prose prose-gray max-w-none">
                        <div
                          className="text-gray-700 leading-relaxed mb-6"
                          dangerouslySetInnerHTML={{ __html: currentItem.content }}
                        />
                      </div>

                      <div className="border-t border-gray-200 pt-6">
                        <h3 className="text-lg font-semibold text-gray-800 mb-3">
                          Question de validation
                        </h3>
                        <p className="text-gray-700 mb-4">
                          {currentItem.question}
                        </p>

                        <div className="space-y-4">
                          {currentItem.testType === "mcq" ? (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-3">
                                Choisissez la bonne réponse :
                              </label>
                              <div className="space-y-2">
                                {currentItem.options.map((option, index) => (
                                  <label key={index} className="flex items-center">
                                    <input
                                      type="radio"
                                      name="mcq-answer"
                                      value={index}
                                      checked={selectedOption === index}
                                      onChange={(e) => setSelectedOption(parseInt(e.target.value))}
                                      className="mr-3"
                                      disabled={lessonResult?.passed}
                                    />
                                    <span className="text-gray-700">{option}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Votre réponse :
                              </label>
                              <input
                                type="text"
                                value={lessonAnswer}
                                onChange={(e) => setLessonAnswer(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Tapez votre réponse ici..."
                                disabled={lessonResult?.passed}
                              />
                            </div>
                          )}

                          {!lessonResult?.passed && (
                            <button
                              onClick={testLesson}
                              disabled={currentItem.testType === "mcq" ? selectedOption === null : !lessonAnswer.trim()}
                              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-semibold"
                            >
                              Valider la réponse
                            </button>
                          )}

                          {lessonResult && (
                            <div className={`p-4 rounded-lg ${
                              lessonResult.passed
                                ? "bg-green-50 border border-green-200"
                                : "bg-red-50 border border-red-200"
                            }`}>
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">
                                  {lessonResult.passed ? "✅" : "❌"}
                                </span>
                                <div>
                                  <p className={`font-semibold ${
                                    lessonResult.passed ? "text-green-800" : "text-red-800"
                                  }`}>
                                    {lessonResult.passed ? "Bonne réponse !" : "Réponse incorrecte"}
                                  </p>
                                  {!lessonResult.passed && (
                                    <p className="text-red-700 text-sm mt-1">
                                      {lessonResult.message}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Affichage d'un exercice */
                <div className="flex flex-col h-full">
                  {/* Instructions */}
                  <div className="bg-blue-50 border-b border-blue-200 p-4">
                    <h3 className="font-semibold text-blue-800 mb-2">📝 Instructions</h3>
                    <div className="text-blue-700 prose prose-blue max-w-none">
                      <div dangerouslySetInnerHTML={{ __html: currentItem.instructions }} />
                    </div>

                    {currentItem.hints && currentItem.hints.length > 0 && (
                      <div className="mt-3">
                        <h4 className="font-semibold text-blue-800 text-sm mb-1">💡 Indices:</h4>
                        <ul className="text-blue-700 text-sm list-disc list-inside">
                          {currentItem.hints.map((hint, index) => (
                            <li key={index}>{hint}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Éditeur et résultats */}
                  <div className="flex flex-1">
                    {/* Éditeur */}
                    <div className="flex-1">
                      {files.length > 0 ? (
                        <>
                          {/* Onglets pour fichiers multiples */}
                          <div className="bg-gray-800 border-b border-gray-700">
                            <div className="flex items-center overflow-x-auto">
                              {files.map(file => (
                                <button
                                  key={file.id}
                                  onClick={() => setActiveFileId(file.id)}
                                  className={`px-4 py-2 text-sm border-r border-gray-700 ${
                                    activeFileId === file.id
                                      ? "bg-gray-900 text-white"
                                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                                  }`}
                                >
                                  {file.name}
                                </button>
                              ))}
                            </div>
                          </div>

                          <Editor
                            height="100%"
                            language={activeFile?.language}
                            value={activeFile?.content}
                            onChange={updateFileContent}
                            theme="vs-dark"
                            options={{
                              minimap: { enabled: false },
                              fontSize: 14,
                              lineNumbers: "on",
                              scrollBeyondLastLine: false,
                              automaticLayout: true
                            }}
                          />
                        </>
                      ) : (
                        <Editor
                          height="100%"
                          language="php"
                          value={code}
                          onChange={setCode}
                          theme="vs-dark"
                          options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            lineNumbers: "on",
                            scrollBeyondLastLine: false,
                            automaticLayout: true
                          }}
                        />
                      )}
                    </div>

                    {/* Résultats du test */}
                    <div className="w-96 bg-white border-l border-gray-200 flex flex-col">
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="font-semibold text-gray-800">   Résultats du Test</h3>
                      </div>

                      {/* Bouton Tester - toujours visible en haut */}
                      <div className="p-4 border-b border-gray-200 bg-gray-50">
                        <button
                          onClick={testExercise}
                          disabled={isTesting}
                          className={`w-full px-6 py-3 rounded-lg font-semibold text-lg ${
                            isTesting
                              ? "bg-gray-400 cursor-not-allowed"
                              : "bg-green-600 hover:bg-green-700"
                          } text-white`}
                        >
                          {isTesting ? "⏳ Test en cours..." : "✅ Tester"}
                        </button>
                      </div>

                      <div className="flex-1 p-4 overflow-y-auto">
                        {testResult ? (
                          <div className={`p-4 rounded-lg ${
                            testResult.passed
                              ? "bg-green-50 border border-green-200"
                              : "bg-red-50 border border-red-200"
                          }`}>
                            <div className="flex items-center mb-2">
                              <span className="text-2xl mr-2">
                                {testResult.passed ? "✅" : "❌"}
                              </span>
                              <span className={`font-semibold ${
                                testResult.passed ? "text-green-800" : "text-red-800"
                              }`}>
                                {testResult.passed ? "Test Réussi !" : "Test Échoué"}
                              </span>
                            </div>

                            <p className={`text-sm mb-3 ${
                              testResult.passed ? "text-green-700" : "text-red-700"
                            }`}>
                              {testResult.message}
                            </p>

                            {testResult.details && (
                              <div className="text-xs text-gray-600">
                                <h4 className="font-semibold mb-1">Détails:</h4>
                                <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">
                                  {JSON.stringify(testResult.details, null, 2)}
                                </pre>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center text-gray-500 mt-8">
                            <div className="text-4xl mb-4">🎯</div>
                            <p>Les résultats du test apparaîtront ici</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
