import React, { useState } from "react";
import Editor from "@monaco-editor/react";

export default function PhpEditor() {
  const [code, setCode] = useState(`<?php echo "Hello World"; ?>`);
  const [output, setOutput] = useState("");

  const runCode = async () => {
    const res = await fetch("http://localhost:4000/api/run-php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    setOutput(data.output || data.error);
  };

  return (
    <div className="p-4">
      <Editor
        height="400px"
        defaultLanguage="php"
        defaultValue={code}
        onChange={setCode}
        theme="vs-dark"
      />
      <button onClick={runCode} className="mt-2 bg-blue-600 text-white px-4 py-2 rounded">
        Exécuter
      </button>
      <pre className="mt-2 p-2 border rounded bg-gray-100">{output}</pre>
    </div>
  );
}

