import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function ExerciseMode() {
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [code, setCode] = useState("");
  const [files, setFiles] = useState([]);
  const [activeFileId, setActiveFileId] = useState(1);
  const [testResult, setTestResult] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  // Charger les exercices au démarrage
  useEffect(() => {
    fetch("/api/exercises")
      .then((res) => res.json())
      .then((data) => setExercises(data))
      .catch((err) => console.error("Erreur chargement exercices:", err));
  }, []);

  // Charger un exercice spécifique
  const loadExercise = async (exerciseId) => {
    try {
      const res = await fetch(`/api/exercises/${exerciseId}`);
      const exercise = await res.json();

      setSelectedExercise(exercise);

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
    } catch (error) {
      console.error("Erreur chargement exercice:", error);
    }
  };

  // Tester l'exercice
  const testExercise = async () => {
    if (!selectedExercise) return;

    setIsTesting(true);
    try {
      const payload = {
        exerciseId: selectedExercise.id,
        code: files.length > 0 ? "" : code,
        files: files.length > 0 ? files.map(f => ({ name: f.name, content: f.content })) : null
      };

      const res = await fetch("/api/test-exercise", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      setTestResult(result);
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

  // Mettre à jour le contenu d'un fichier
  const updateFileContent = (content) => {
    if (files.length > 0) {
      setFiles(files.map(f =>
        f.id === activeFileId ? { ...f, content } : f
      ));
    } else {
      setCode(content);
    }
  };

  // Obtenir le fichier actif
  const activeFile = files.find(f => f.id === activeFileId);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar avec la liste des exercices */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">🧠 Exercices PHP</h2>
          <p className="text-sm text-gray-600 mt-1">
            Apprenez PHP avec des exercices interactifs
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {exercises.map((exercise) => (
            <div
              key={exercise.id}
              onClick={() => loadExercise(exercise.id)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                selectedExercise?.id === exercise.id ? "bg-blue-50 border-l-4 border-l-blue-500" : ""
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800 text-sm">
                    {exercise.title}
                  </h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                    {exercise.description}
                  </p>
                </div>
                <div className="ml-2 flex flex-col items-end">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' :
                    exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {exercise.difficulty === 'beginner' ? 'Débutant' :
                     exercise.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                  </span>
                  <span className="text-xs text-gray-500 mt-1 capitalize">
                    {exercise.category}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone principale */}
      <div className="flex-1 flex flex-col">
        {selectedExercise ? (
          <>
            {/* En-tête de l'exercice */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-800">
                    {selectedExercise.title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedExercise.description}
                  </p>
                </div>
                <button
                  onClick={testExercise}
                  disabled={isTesting}
                  className={`px-6 py-2 rounded-lg font-semibold ${
                    isTesting
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  } text-white`}
                >
                  {isTesting ? "⏳ Test en cours..." : "✅ Tester"}
                </button>
              </div>

              {/* Instructions */}
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">📝 Instructions</h3>
                <p className="text-blue-700">{selectedExercise.instructions}</p>

                {selectedExercise.hints && selectedExercise.hints.length > 0 && (
                  <div className="mt-3">
                    <h4 className="font-semibold text-blue-800 text-sm mb-1">💡 Indices:</h4>
                    <ul className="text-blue-700 text-sm list-disc list-inside">
                      {selectedExercise.hints.map((hint, index) => (
                        <li key={index}>{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Éditeur et onglets */}
            <div className="flex-1 flex">
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
                  <h3 className="font-semibold text-gray-800">📊 Résultats du Test</h3>
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
                      <p>Cliquez sur "Tester" pour vérifier votre solution</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Écran d'accueil */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">🧠</div>
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Mode Exercices PHP
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Choisissez un exercice dans la liste à gauche pour commencer à apprendre !
              </p>
              <div className="text-sm text-gray-500">
                {exercises.length} exercices disponibles
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
