import React, { useState, useEffect } from "react";
import { useAuth } from "./AuthContext.jsx";

export default function BadgesView() {
  const [badges, setBadges] = useState([]);
  const [allBadges, setAllBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingBadge, setEditingBadge] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', icon: '' });
  const { getAuthHeaders, user } = useAuth();

  useEffect(() => {
    fetchBadges();
    if (user?.role === 'teacher') {
      fetchAllBadges();
    }
  }, [user]);

  const fetchBadges = async () => {
    try {
      const res = await fetch("/api/user/badges", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setBadges(data);
    } catch (err) {
      console.error("Erreur chargement badges:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllBadges = async () => {
    try {
      const res = await fetch("/api/badges", {
        headers: getAuthHeaders()
      });
      const data = await res.json();
      setAllBadges(data);
    } catch (err) {
      console.error("Erreur chargement tous les badges:", err);
    }
  };

  const startEditing = (badge) => {
    setEditingBadge(badge.id);
    setEditForm({
      name: badge.name,
      description: badge.description || '',
      icon: badge.icon
    });
  };

  const cancelEditing = () => {
    setEditingBadge(null);
    setEditForm({ name: '', description: '', icon: '' });
  };

  const saveBadge = async () => {
    try {
      const res = await fetch(`/api/badges/${editingBadge}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      });

      if (res.ok) {
        await fetchAllBadges();
        cancelEditing();
      } else {
        console.error("Erreur lors de la sauvegarde du badge");
      }
    } catch (err) {
      console.error("Erreur sauvegarde badge:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des badges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* En-tête */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {user?.role === 'teacher' ? '🏆 Gestion des Badges' : '🏆 Mes Badges'}
          </h1>
          <p className="text-gray-600">
            {user?.role === 'teacher'
              ? 'Modifiez les noms et descriptions des badges'
              : 'Collectionnez des badges en complétant des thèmes d\'apprentissage !'
            }
          </p>
        </div>

        {user?.role === 'teacher' ? (
          // Vue enseignant
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Tous les Badges</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    {editingBadge === badge.id ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Icône
                          </label>
                          <input
                            type="text"
                            value={editForm.icon}
                            onChange={(e) => setEditForm({...editForm, icon: e.target.value})}
                            className="w-full p-2 border rounded"
                            placeholder="🏆"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Nom
                          </label>
                          <input
                            type="text"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                          </label>
                          <textarea
                            value={editForm.description}
                            onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                            className="w-full p-2 border rounded"
                            rows="3"
                          />
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={saveBadge}
                            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                          >
                            Sauvegarder
                          </button>
                          <button
                            onClick={cancelEditing}
                            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">
                          {badge.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {badge.description}
                        </p>
                        <button
                          onClick={() => startEditing(badge)}
                          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          // Vue élève
          <>
            {/* Statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{badges.length}</div>
                <div className="text-gray-600">Badges obtenus</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {badges.filter(b => b.theme_id).length}
                </div>
                <div className="text-gray-600">Thèmes maîtrisés</div>
              </div>
              <div className="bg-white rounded-lg shadow-sm p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {new Set(badges.map(b => b.theme_id).filter(Boolean)).size}
                </div>
                <div className="text-gray-600">Domaines explorés</div>
              </div>
            </div>

            {/* Collection de badges */}
            {badges.length > 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Ma Collection
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="text-center">
                        <div className="text-4xl mb-3">{badge.icon}</div>
                        <h3 className="font-semibold text-gray-800 text-lg mb-2">
                          {badge.name}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {badge.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Aucun badge pour le moment
                </h2>
                <p className="text-gray-600 mb-4">
                  Commencez à apprendre pour gagner vos premiers badges !
                </p>
                <p className="text-sm text-gray-500">
                  Complétez entièrement un thème pour obtenir un badge.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
