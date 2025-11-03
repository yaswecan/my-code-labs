import { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function DatabaseInfo() {
  const [dbInfo, setDbInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const { getAuthHeaders } = useAuth();

  useEffect(() => {
    fetchDatabaseInfo();
  }, []);

  const fetchDatabaseInfo = async () => {
    try {
      const response = await fetch("/api/user/database-info", {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error("Impossible de récupérer les informations de la base de données");
      }

      const data = await response.json();
      setDbInfo(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert("Copié dans le presse-papiers !");
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Chargement des informations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-4xl mb-4">❌</div>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-gray-50 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🗄️ Ma Base de Données MySQL
          </h1>
          <p className="text-gray-600">
            Voici les informations de connexion à votre base de données personnelle
          </p>
        </div>

        {/* Informations de connexion */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📋 Informations de Connexion
          </h2>

          <div className="space-y-4">
            {/* Nom de la base */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Nom de la base de données
                </label>
                <code className="text-lg font-mono text-gray-800">
                  {dbInfo.dbName}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(dbInfo.dbName)}
                className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                📋 Copier
              </button>
            </div>

            {/* Utilisateur */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Utilisateur
                </label>
                <code className="text-lg font-mono text-gray-800">
                  {dbInfo.dbUser}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(dbInfo.dbUser)}
                className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                📋 Copier
              </button>
            </div>

            {/* Mot de passe */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Mot de passe
                </label>
                <code className="text-lg font-mono text-gray-800">
                  {showPassword ? dbInfo.dbPassword : "••••••••••••••••"}
                </code>
              </div>
              <div className="ml-4 flex space-x-2">
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="px-3 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm"
                >
                  {showPassword ? "👁️ Masquer" : "👁️ Afficher"}
                </button>
                <button
                  onClick={() => copyToClipboard(dbInfo.dbPassword)}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
                >
                  📋 Copier
                </button>
              </div>
            </div>

            {/* Hôte */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Hôte
                </label>
                <code className="text-lg font-mono text-gray-800">
                  {dbInfo.dbHost}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(dbInfo.dbHost)}
                className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                📋 Copier
              </button>
            </div>

            {/* Port */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Port
                </label>
                <code className="text-lg font-mono text-gray-800">
                  {dbInfo.dbPort}
                </code>
              </div>
              <button
                onClick={() => copyToClipboard(dbInfo.dbPort.toString())}
                className="ml-4 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm"
              >
                📋 Copier
              </button>
            </div>
          </div>
        </div>

        {/* Accès phpMyAdmin */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🌐 Accès phpMyAdmin
          </h2>
          <p className="text-gray-700 mb-4">
            Gérez votre base de données visuellement avec phpMyAdmin
          </p>
          <a
            href={dbInfo.phpmyadminUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold text-center"
          >
            🚀 Ouvrir phpMyAdmin
          </a>
          <p className="text-sm text-gray-600 mt-3">
            💡 Utilisez les identifiants ci-dessus pour vous connecter
          </p>
        </div>

        {/* Exemple de code PHP */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            💻 Exemple de Connexion PHP
          </h2>
          <p className="text-gray-700 mb-4">
            Utilisez ce code dans vos exercices pour vous connecter à votre base de données :
          </p>
          <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
            <pre className="text-green-400 text-sm font-mono">
{`<?php
$host = "${dbInfo.dbHost}";
$dbname = "${dbInfo.dbName}";
$username = "${dbInfo.dbUser}";
$password = "${dbInfo.dbPassword}";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion réussie !";
} catch(PDOException $e) {
    echo "❌ Erreur : " . $e->getMessage();
}
?>`}
            </pre>
          </div>
          <button
            onClick={() => copyToClipboard(`<?php
$host = "${dbInfo.dbHost}";
$dbname = "${dbInfo.dbName}";
$username = "${dbInfo.dbUser}";
$password = "${dbInfo.dbPassword}";

try {
    $pdo = new PDO(
        "mysql:host=$host;dbname=$dbname;charset=utf8mb4",
        $username,
        $password
    );
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "✅ Connexion réussie !";
} catch(PDOException $e) {
    echo "❌ Erreur : " . $e->getMessage();
}
?>`)}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
          >
            📋 Copier le code
          </button>
        </div>

        {/* Avertissement */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-2xl">⚠️</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Important
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>Ne partagez jamais vos identifiants de base de données</li>
                  <li>Cette base de données est personnelle et isolée</li>
                  <li>Vos données sont sauvegardées automatiquement</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
