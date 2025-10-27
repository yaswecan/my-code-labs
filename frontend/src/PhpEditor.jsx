import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";

export default function PhpEditor() {
  const [code, setCode] = useState(`<?php
// Exemple avec HTML et CSS
echo '<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; }
    .container { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); max-width: 600px; margin: 0 auto; }
    h1 { color: #667eea; text-align: center; }
    .info { background: #f0f4ff; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
    button { background: #667eea; color: white; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }
    button:hover { background: #764ba2; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🎨 PHP avec HTML & CSS</h1>
    <div class="info">
      <p><strong>Date:</strong> ' . date('d/m/Y H:i:s') . '</p>
      <p><strong>Message:</strong> Bienvenue dans l\'éditeur PHP!</p>
    </div>
    <button onclick="alert(\'Hello from PHP!\')">Cliquez-moi</button>
  </div>
</body>
</html>';
?>`);
  const [output, setOutput] = useState("");
  const [isHtml, setIsHtml] = useState(false);
  const [viewMode, setViewMode] = useState("rendered"); // "rendered" ou "source"
  const iframeRef = useRef(null);

  const runCode = async () => {
    const res = await fetch("http://localhost:4000/api/run-php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setOutput(data.output || data.error);
    setIsHtml(data.isHtml || false);
  };

  // Mettre à jour l'iframe quand le contenu HTML change
  useEffect(() => {
    if (isHtml && iframeRef.current && viewMode === "rendered") {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow.document;
      iframeDoc.open();
      iframeDoc.write(output);
      iframeDoc.close();
    }
  }, [output, isHtml, viewMode]);

  return (
    <div className="p-4">
      <Editor
        height="400px"
        defaultLanguage="php"
        defaultValue={code}
        onChange={setCode}
        theme="vs-dark"
      />
      <div className="mt-2 flex gap-2">
        <button onClick={runCode} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          ▶ Exécuter
        </button>
        {isHtml && (
          <button 
            onClick={() => setViewMode(viewMode === "rendered" ? "source" : "rendered")}
            className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
          >
            {viewMode === "rendered" ? "📄 Voir le code source" : "🎨 Voir le rendu"}
          </button>
        )}
      </div>
      
      <div className="mt-4">
        <h3 className="text-lg font-semibold mb-2">Résultat:</h3>
        {isHtml ? (
          viewMode === "rendered" ? (
            <iframe
              ref={iframeRef}
              className="w-full border rounded bg-white"
              style={{ minHeight: "400px", height: "auto" }}
              sandbox="allow-scripts allow-same-origin"
              title="PHP Output"
            />
          ) : (
            <pre className="p-4 border rounded bg-gray-100 overflow-auto max-h-96">{output}</pre>
          )
        ) : (
          <pre className="p-4 border rounded bg-gray-100 overflow-auto max-h-96">{output}</pre>
        )}
      </div>
    </div>
  );
}

