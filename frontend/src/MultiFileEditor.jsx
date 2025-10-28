import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function MultiFileEditor() {
  // État pour gérer les fichiers
  const [files, setFiles] = useState([
    {
      id: 1,
      name: "index.php",
      content: `<?php
// Fichier principal
?>
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mon Projet PHP</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>🚀 Projet Multi-Fichiers</h1>
    <p>Date: <?php echo date('d/m/Y H:i:s'); ?></p>
    <button onclick="showMessage()">Cliquez-moi</button>
  </div>
  <script src="script.js"></script>
</body>
</html>`,
      language: "php"
    },
    {
      id: 2,
      name: "style.css",
      content: `body {
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  margin: 0;
}

.container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #667eea;
  text-align: center;
}

button {
  background: #667eea;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
  display: block;
  margin: 20px auto;
}

button:hover {
  background: #764ba2;
}`,
      language: "css"
    },
    {
      id: 3,
      name: "script.js",
      content: `function showMessage() {
  alert('Hello from JavaScript!');
  console.log('Button clicked!');
}

console.log('Script loaded successfully!');`,
      language: "javascript"
    }
  ]);

  const [activeFileId, setActiveFileId] = useState(1);
  const [output, setOutput] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [viewMode, setViewMode] = useState("rendered");
  const [isExecuting, setIsExecuting] = useState(false);
  const iframeRef = useRef(null);
  const [nextId, setNextId] = useState(4);

  // Obtenir le fichier actif
  const activeFile = files.find(f => f.id === activeFileId);

  // Mettre à jour le contenu du fichier actif
  const updateFileContent = (content) => {
    setFiles(files.map(f => 
      f.id === activeFileId ? { ...f, content } : f
    ));
  };

  // Ajouter un nouveau fichier
  const addFile = () => {
    const fileName = prompt("Nom du fichier (ex: utils.php, custom.css, app.js):");
    if (!fileName) return;

    // Déterminer le langage basé sur l'extension
    let language = "php";
    if (fileName.endsWith(".css")) language = "css";
    else if (fileName.endsWith(".js")) language = "javascript";
    else if (fileName.endsWith(".html")) language = "html";

    const newFile = {
      id: nextId,
      name: fileName,
      content: "",
      language
    };

    setFiles([...files, newFile]);
    setNextId(nextId + 1);
    setActiveFileId(newFile.id);
  };

  // Supprimer un fichier
  const deleteFile = (fileId) => {
    if (files.length === 1) {
      alert("Vous devez garder au moins un fichier!");
      return;
    }

    const file = files.find(f => f.id === fileId);
    if (!confirm(`Supprimer ${file.name} ?`)) return;

    const newFiles = files.filter(f => f.id !== fileId);
    setFiles(newFiles);

    // Si le fichier actif est supprimé, basculer vers le premier fichier
    if (activeFileId === fileId) {
      setActiveFileId(newFiles[0].id);
    }
  };

  // Renommer un fichier
  const renameFile = (fileId) => {
    const file = files.find(f => f.id === fileId);
    const newName = prompt("Nouveau nom:", file.name);
    if (!newName || newName === file.name) return;

    // Mettre à jour le langage si l'extension change
    let language = file.language;
    if (newName.endsWith(".css")) language = "css";
    else if (newName.endsWith(".js")) language = "javascript";
    else if (newName.endsWith(".html")) language = "html";
    else if (newName.endsWith(".php")) language = "php";

    setFiles(files.map(f => 
      f.id === fileId ? { ...f, name: newName, language } : f
    ));
  };

  // Exécuter le projet
  const runProject = async () => {
    setIsExecuting(true);
    try {
      const res = await fetch("/api/run-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          files: files.map(f => ({
            name: f.name,
            content: f.content
          })),
          entryPoint: "index.php"
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      setOutput(data.output || data.error);
      setIsHtml(data.isHtml || false);
    } catch (error) {
      setOutput("Erreur: " + error.message);
      setIsHtml(false);
    } finally {
      setIsExecuting(false);
    }
  };

  // Mettre à jour l'iframe
  useEffect(() => {
    if (isHtml && iframeRef.current && viewMode === "rendered") {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(output);
      iframeDoc.close();
    }
  }, [output, isHtml, viewMode]);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Barre d'onglets */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="flex items-center overflow-x-auto">
          {files.map(file => (
            <div
              key={file.id}
              className={`flex items-center px-4 py-2 cursor-pointer border-r border-gray-700 ${
                activeFileId === file.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              <span
                onClick={() => setActiveFileId(file.id)}
                className="mr-2"
              >
                {file.name}
              </span>
              <button
                onClick={() => renameFile(file.id)}
                className="mr-1 text-xs hover:text-blue-400"
                title="Renommer"
              >
                ✏️
              </button>
              <button
                onClick={() => deleteFile(file.id)}
                className="text-xs hover:text-red-400"
                title="Supprimer"
              >
                ✕
              </button>
            </div>
          ))}
          <button
            onClick={addFile}
            className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-700"
            title="Ajouter un fichier"
          >
            + Nouveau fichier
          </button>
        </div>
      </div>

      {/* Éditeur */}
      <div className="flex-1 overflow-hidden">
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
      </div>

      {/* Barre d'actions */}
      <div className="bg-white border-t border-gray-300 p-3 flex gap-2 items-center">
        <button
          onClick={runProject}
          disabled={isExecuting}
          className={`px-4 py-2 rounded font-semibold ${
            isExecuting
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          } text-white`}
        >
          {isExecuting ? "⏳ Exécution..." : "▶ Exécuter le Projet"}
        </button>
        
        {isHtml && (
          <button
            onClick={() => setViewMode(viewMode === "rendered" ? "source" : "rendered")}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            {viewMode === "rendered" ? "📄 Code Source" : "🎨 Rendu"}
          </button>
        )}

        <div className="ml-auto text-sm text-gray-600">
          {files.length} fichier{files.length > 1 ? "s" : ""} • Fichier actif: {activeFile?.name}
        </div>
      </div>

      {/* Zone de résultat */}
      <div className="bg-white border-t border-gray-300 p-4" style={{ height: "40vh", overflow: "auto" }}>
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Résultat:</h3>
        {output ? (
          isHtml ? (
            viewMode === "rendered" ? (
              <iframe
                ref={iframeRef}
                className="w-full border rounded bg-white"
                style={{ height: "calc(40vh - 60px)" }}
                sandbox="allow-scripts allow-same-origin"
                title="PHP Output"
              />
            ) : (
              <pre className="p-4 border rounded bg-gray-100 overflow-auto text-sm" style={{ maxHeight: "calc(40vh - 60px)" }}>
                {output}
              </pre>
            )
          ) : (
            <pre className="p-4 border rounded bg-gray-100 overflow-auto text-sm" style={{ maxHeight: "calc(40vh - 60px)" }}>
              {output}
            </pre>
          )
        ) : (
          <p className="text-gray-500 italic">Cliquez sur "Exécuter le Projet" pour voir le résultat...</p>
        )}
      </div>
    </div>
  );
}
