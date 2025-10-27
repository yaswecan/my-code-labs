import PhpEditor from "./PhpEditor.jsx";

function App() {
  return (
    <div className="App min-h-screen bg-gray-50">
      <div className="container mx-auto py-8">
        <h1 className="text-4xl font-bold text-center mb-2 text-gray-800">
          🚀 Éditeur PHP avec Rendu HTML/CSS
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Écrivez du code PHP et visualisez le rendu HTML/CSS en temps réel
        </p>
        <PhpEditor />
      </div>
    </div>
  );
}

export default App;
