import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthContext.jsx';
import LessonExerciseEditor from './LessonExerciseEditor.jsx';
import BadgesView from './BadgesView.jsx';

// Composant pour créer une nouvelle classe
const CreateClassModal = ({ isOpen, onClose, onClassCreated }) => {
  const { getAuthHeaders } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: name.trim(), description: description.trim() }),
      });

      if (response.ok) {
        setName('');
        setDescription('');
        onClose();
        onClassCreated();
      } else {
        console.error('Erreur lors de la création de la classe');
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Créer une nouvelle classe</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nom de la classe *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Classe 6ème A"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="Description de la classe..."
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Création...' : 'Créer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Composant pour gérer les élèves d'une classe
const ManageClassStudentsModal = ({ isOpen, onClose, classData, onStudentsUpdated }) => {
  const { getAuthHeaders } = useAuth();
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && classData) {
      loadStudents();
    }
  }, [isOpen, classData]);

  const loadStudents = async () => {
    try {
      const [allResponse, classResponse] = await Promise.all([
        fetch('/api/teacher/students', { headers: getAuthHeaders() }),
        fetch(`/api/classes/${classData.id}/students`, { headers: getAuthHeaders() })
      ]);

      if (allResponse.ok && classResponse.ok) {
        const allData = await allResponse.json();
        const classDataStudents = await classResponse.json();

        setAllStudents(allData);
        setSelectedStudents(classDataStudents.map(s => s.id));
      }
    } catch (error) {
      console.error('Erreur chargement élèves:', error);
    }
  };

  const handleStudentToggle = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/classes/${classData.id}/students`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds: selectedStudents }),
      });

      if (response.ok) {
        onClose();
        onStudentsUpdated();
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !classData) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">
          Gérer les élèves - {classData.name}
        </h2>

        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Sélectionnez les élèves à assigner à cette classe :
          </p>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allStudents.map(student => (
            <label key={student.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
              <input
                type="checkbox"
                checked={selectedStudents.includes(student.id)}
                onChange={() => handleStudentToggle(student.id)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium">{student.username}</div>
                <div className="text-sm text-gray-500">{student.email}</div>
              </div>
              {student.class_id && student.class_id !== classData.id && (
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                  Dans une autre classe
                </span>
              )}
            </label>
          ))}
        </div>

        <div className="flex justify-end space-x-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Mapping des exercices et leçons vers leurs thèmes
const exerciseToTheme = {
  'hello-world': 'Faites vos premiers pas en PHP',
  'variables-numbers': 'Faites vos premiers pas en PHP',
  'php-functions': 'Faites vos premiers pas en PHP',
  'arrays-loops': 'Faites vos premiers pas en PHP',
  'html-css-js': 'Faites vos premiers pas en PHP',
  'pdo-connection': 'Manipuler MySQL avec PHP (PDO)',
  'select-users': 'Manipuler MySQL avec PHP (PDO)',
  'insert-user': 'Manipuler MySQL avec PHP (PDO)',
  'update-user': 'Manipuler MySQL avec PHP (PDO)',
  'delete-user': 'Manipuler MySQL avec PHP (PDO)',
};

const lessonToTheme = {
  'php-introduction': 'Faites vos premiers pas en PHP',
  'variables-basics': 'Faites vos premiers pas en PHP',
  'functions-basics': 'Faites vos premiers pas en PHP',
  'arrays-loops': 'Faites vos premiers pas en PHP',
  'web-integration': 'Faites vos premiers pas en PHP',
  'pdo-intro': 'Manipuler MySQL avec PHP (PDO)',
  'pdo-select': 'Manipuler MySQL avec PHP (PDO)',
  'pdo-insert': 'Manipuler MySQL avec PHP (PDO)',
  'pdo-update-delete': 'Manipuler MySQL avec PHP (PDO)',
  'security-prepared': 'Manipuler MySQL avec PHP (PDO)',
};

const TeacherDashboard = () => {
  const { user, getAuthHeaders } = useAuth();
  const [classes, setClasses] = useState([]);
  const [classOverviews, setClassOverviews] = useState([]);
  const [overview, setOverview] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProgress, setStudentProgress] = useState(null);
  const [studentBadges, setStudentBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [showManageStudentsModal, setShowManageStudentsModal] = useState(false);
  const [classToManage, setClassToManage] = useState(null);

  useEffect(() => {
    loadClasses();
    loadOverview();
    loadStudents();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des classes');
      }

      const data = await response.json();
      setClasses(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadOverview = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/overview', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'aperçu');
      }

      const data = await response.json();
      setOverview(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch('/api/teacher/students', {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement des élèves');
      }

      const data = await response.json();
      setStudents(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const loadClassOverview = async (classId) => {
    try {
      const response = await fetch(`/api/classes/${classId}/overview`, {
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error('Erreur lors du chargement de l\'aperçu de classe');
      }

      const data = await response.json();
      setClassOverviews(prev => ({
        ...prev,
        [classId]: data
      }));
    } catch (err) {
      setError(err.message);
    }
  };

  const loadStudentProgress = async (studentId) => {
    try {
      setLoading(true);

      // Charger la progression
      const progressResponse = await fetch(`/api/teacher/student/${studentId}/progress`, {
        headers: getAuthHeaders(),
      });

      if (!progressResponse.ok) {
        throw new Error('Erreur lors du chargement de la progression');
      }

      const progressData = await progressResponse.json();
      setStudentProgress(progressData);
      setSelectedStudent(progressData.student);

      // Charger les badges de l'élève
      try {
        const badgesResponse = await fetch(`/api/user/${studentId}/badges`, {
          headers: getAuthHeaders(),
        });

        if (badgesResponse.ok) {
          const badgesData = await badgesResponse.json();
          setStudentBadges(badgesData);
        } else {
          setStudentBadges([]);
        }
      } catch (badgeErr) {
        console.error('Erreur chargement badges:', badgeErr);
        setStudentBadges([]);
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = ({ progress, className = "w-full" }) => (
    <div className={`bg-gray-200 rounded-full h-2 ${className}`}>
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, progress)}%` }}
      ></div>
    </div>
  );

  if (loading && !overview) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Chargement du tableau de bord...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">❌</div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          Tableau de Bord Enseignant
        </h1>

        {/* Onglets */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('classes')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'classes'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
                Mes Classes
            </button>
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
                 Aperçu Élèves
            </button>
            <button
              onClick={() => setActiveTab('content')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'content'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
                Gestion du Contenu
            </button>
            <button
              onClick={() => setActiveTab('badges')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'badges'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
                 Gestion des Badges
            </button>
          </nav>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'classes' && (
          <>
            {/* Gestion des classes */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">Mes Classes</h2>
                <button
                  onClick={() => setShowCreateClassModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  + Créer une classe
                </button>
              </div>

              {classes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((classItem) => (
                    <div
                      key={classItem.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {classItem.name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          {new Date(classItem.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {classItem.description && (
                        <p className="text-gray-600 text-sm mb-4">
                          {classItem.description}
                        </p>
                      )}
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setClassToManage(classItem);
                            setShowManageStudentsModal(true);
                          }}
                          className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                        >
                          Gérer élèves
                        </button>
                        <button
                          onClick={() => {
                            setSelectedClass(classItem);
                            loadClassOverview(classItem.id);
                          }}
                          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
                        >
                          Voir aperçu
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2"> </div>
                  <p>Aucune classe créée pour le moment</p>
                  <button
                    onClick={() => setShowCreateClassModal(true)}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Créer ma première classe
                  </button>
                </div>
              )}
            </div>

            {/* Aperçu de la classe sélectionnée */}
            {selectedClass && classOverviews[selectedClass.id] && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Aperçu - {classes.find(c => c.id === selectedClass.id)?.name}
                  </h2>
                  <button
                    onClick={() => setSelectedClass(null)}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Fermer
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {classOverviews[selectedClass.id].totalStudents}
                    </div>
                    <div className="text-gray-600">Élèves inscrits</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">
                      {classOverviews[selectedClass.id].averageProgress}%
                    </div>
                    <div className="text-gray-600">Progression moyenne</div>
                  </div>
                  <div className="text-center">
                    <ProgressBar progress={classOverviews[selectedClass.id].averageProgress} />
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Élèves de la classe</h3>
                  {classOverviews[selectedClass.id].students.map((student) => (
                    <div
                      key={student.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => loadStudentProgress(student.id)}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className="font-semibold">{student.username}</h4>
                          <p className="text-sm text-gray-600">{student.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold">
                            {student.progress}%
                          </div>
                          <ProgressBar progress={student.progress} className="w-32" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Détails de l'élève sélectionné depuis l'aperçu de classe */}
            {studentProgress && selectedStudent && (
              <div className="bg-white rounded-lg shadow-md p-6 mt-8">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold">
                    Progression de {selectedStudent.username}
                  </h2>
                  <button
                    onClick={() => {
                      setSelectedStudent(null);
                      setStudentProgress(null);
                      setStudentBadges([]);
                    }}
                    className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Fermer
                  </button>
                </div>

                {/* Statistiques générales */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {studentProgress.statistics.totalExercises}
                    </div>
                    <div className="text-sm text-gray-600">Exercices commencés</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {studentProgress.statistics.completedExercises}
                    </div>
                    <div className="text-sm text-gray-600">Exercices terminés</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded">
                    <div className="text-2xl font-bold text-purple-600">
                      {studentProgress.statistics.totalLessons}
                    </div>
                    <div className="text-sm text-gray-600">Leçons commencées</div>
                  </div>
                  <div className="text-center p-4 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {studentProgress.statistics.completedLessons}
                    </div>
                    <div className="text-sm text-gray-600">Leçons terminées</div>
                  </div>
                </div>

                {/* Progression globale */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Progression globale</h3>
                    <span className="text-lg font-bold">
                      {studentProgress.statistics.overallProgress}%
                    </span>
                  </div>
                  <ProgressBar progress={studentProgress.statistics.overallProgress} />
                </div>

                {/* Badges de l'élève */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">   Badges obtenus ({studentBadges.length})</h3>
                  {studentBadges.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {studentBadges.map((badge) => (
                        <div
                          key={badge.id}
                          className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4"
                        >
                          <div className="text-center">
                            <div className="text-3xl mb-2">{badge.icon}</div>
                            <h4 className="font-semibold text-gray-800 text-sm mb-1">
                              {badge.name}
                            </h4>
                            <p className="text-gray-600 text-xs mb-2">
                              {badge.description}
                            </p>
                            <div className="text-xs text-gray-500">
                              Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <div className="text-4xl mb-2">  </div>
                      <p>Aucun badge obtenu pour le moment</p>
                    </div>
                  )}
                </div>

                {/* Progression par thème */}
                <div className="mb-6">
                  <h3 className="font-semibold mb-4">Progression par thème</h3>
                  <div className="space-y-3">
                    {studentProgress.themes.map((theme) => (
                      <div key={theme.id} className="flex items-center justify-between">
                        <span className="text-gray-700">{theme.title}</span>
                        <div className="flex items-center space-x-3 w-48">
                          <ProgressBar progress={theme.progress} className="flex-1" />
                          <span className="text-sm font-medium w-12 text-right">
                            {theme.progress}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Progression par thème avec leçons et exercices */}
                {(() => {
                  // Combiner les thèmes des leçons et exercices
                  const allThemes = new Set([
                    ...studentProgress.lessons.map(lesson => lessonToTheme[lesson.lesson_id] || 'Autre'),
                    ...studentProgress.exercises.map(exercise => exerciseToTheme[exercise.exercise_id] || 'Autre')
                  ]);

                  return Array.from(allThemes).map(themeName => {
                    const themeLessons = studentProgress.lessons.filter(lesson =>
                      (lessonToTheme[lesson.lesson_id] || 'Autre') === themeName
                    );
                    const themeExercises = studentProgress.exercises.filter(exercise =>
                      (exerciseToTheme[exercise.exercise_id] || 'Autre') === themeName
                    );

                    return (
                      <div key={themeName} className="mb-6">
                        <h3 className="font-semibold text-lg text-gray-800 mb-4">{themeName}</h3>

                        {/* Leçons du thème */}
                        {themeLessons.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-medium text-gray-700 mb-2">Leçons</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full table-auto">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left">Leçon</th>
                                    <th className="px-4 py-2 text-center">Terminée</th>
                                    <th className="px-4 py-2 text-center">Score</th>
                                    <th className="px-4 py-2 text-center">Tentatives</th>
                                    <th className="px-4 py-2 text-center">Dernière tentative</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {themeLessons.map((lesson) => (
                                    <tr key={lesson.lesson_id} className="border-t">
                                      <td className="px-4 py-2">{lesson.lesson_id}</td>
                                      <td className="px-4 py-2 text-center">
                                        {lesson.completed ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-red-600">✗</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-center">{lesson.score}%</td>
                                      <td className="px-4 py-2 text-center">{lesson.attempts}</td>
                                      <td className="px-4 py-2 text-center">
                                        {new Date(lesson.last_attempt).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {/* Exercices du thème */}
                        {themeExercises.length > 0 && (
                          <div>
                            <h4 className="font-medium text-gray-700 mb-2">Exercices</h4>
                            <div className="overflow-x-auto">
                              <table className="min-w-full table-auto">
                                <thead>
                                  <tr className="bg-gray-50">
                                    <th className="px-4 py-2 text-left">Exercice</th>
                                    <th className="px-4 py-2 text-center">Terminé</th>
                                    <th className="px-4 py-2 text-center">Score</th>
                                    <th className="px-4 py-2 text-center">Tentatives</th>
                                    <th className="px-4 py-2 text-center">Dernière tentative</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {themeExercises.map((exercise) => (
                                    <tr key={exercise.exercise_id} className="border-t">
                                      <td className="px-4 py-2">{exercise.exercise_id}</td>
                                      <td className="px-4 py-2 text-center">
                                        {exercise.completed ? (
                                          <span className="text-green-600">✓</span>
                                        ) : (
                                          <span className="text-red-600">✗</span>
                                        )}
                                      </td>
                                      <td className="px-4 py-2 text-center">{exercise.score}%</td>
                                      <td className="px-4 py-2 text-center">{exercise.attempts}</td>
                                      <td className="px-4 py-2 text-center">
                                        {new Date(exercise.last_attempt).toLocaleDateString()}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            )}
          </>
        )}

        {activeTab === 'overview' && (
          <>
            {/* Aperçu général */}
            {overview && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Aperçu de la Classe</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">
                  {overview.totalStudents}
                </div>
                <div className="text-gray-600">Élèves inscrits</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  {overview.averageProgress}%
                </div>
                <div className="text-gray-600">Progression moyenne</div>
              </div>
              <div className="text-center">
                <ProgressBar progress={overview.averageProgress} />
              </div>
            </div>
          </div>
        )}

        {/* Liste des élèves */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Élèves</h2>
            <button
              onClick={loadStudents}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Actualiser
            </button>
          </div>

          {students.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {students.map((student) => (
                <div
                  key={student.id}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => loadStudentProgress(student.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-gray-800">
                      {student.username}
                    </h3>
                    <span className="text-sm text-gray-500">
                      {new Date(student.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm mb-2">{student.email}</p>
                  {overview?.students?.find(s => s.id === student.id) && (
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progression</span>
                        <span>{overview.students.find(s => s.id === student.id).progress}%</span>
                      </div>
                      <ProgressBar
                        progress={overview.students.find(s => s.id === student.id).progress}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Aucun élève trouvé. Cliquez sur "Actualiser" pour charger la liste.
            </p>
          )}
        </div>

        {/* Détails de l'élève sélectionné */}
        {studentProgress && selectedStudent && (
          <div className="bg-white rounded-lg shadow-md p-6 mt-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">
                Progression de {selectedStudent.username}
              </h2>
              <button
                onClick={() => {
                  setSelectedStudent(null);
                  setStudentProgress(null);
                  setStudentBadges([]);
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Fermer
              </button>
            </div>

            {/* Statistiques générales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="text-center p-4 bg-blue-50 rounded">
                <div className="text-2xl font-bold text-blue-600">
                  {studentProgress.statistics.totalExercises}
                </div>
                <div className="text-sm text-gray-600">Exercices commencés</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded">
                <div className="text-2xl font-bold text-green-600">
                  {studentProgress.statistics.completedExercises}
                </div>
                <div className="text-sm text-gray-600">Exercices terminés</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded">
                <div className="text-2xl font-bold text-purple-600">
                  {studentProgress.statistics.totalLessons}
                </div>
                <div className="text-sm text-gray-600">Leçons commencées</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded">
                <div className="text-2xl font-bold text-orange-600">
                  {studentProgress.statistics.completedLessons}
                </div>
                <div className="text-sm text-gray-600">Leçons terminées</div>
              </div>
            </div>

            {/* Progression globale */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Progression globale</h3>
                <span className="text-lg font-bold">
                  {studentProgress.statistics.overallProgress}%
                </span>
              </div>
              <ProgressBar progress={studentProgress.statistics.overallProgress} />
            </div>

            {/* Badges de l'élève */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">   Badges obtenus ({studentBadges.length})</h3>
              {studentBadges.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {studentBadges.map((badge) => (
                    <div
                      key={badge.id}
                      className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4"
                    >
                      <div className="text-center">
                        <div className="text-3xl mb-2">{badge.icon}</div>
                        <h4 className="font-semibold text-gray-800 text-sm mb-1">
                          {badge.name}
                        </h4>
                        <p className="text-gray-600 text-xs mb-2">
                          {badge.description}
                        </p>
                        <div className="text-xs text-gray-500">
                          Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">  </div>
                  <p>Aucun badge obtenu pour le moment</p>
                </div>
              )}
            </div>

            {/* Progression par thème */}
            <div className="mb-6">
              <h3 className="font-semibold mb-4">Progression par thème</h3>
              <div className="space-y-3">
                {studentProgress.themes.map((theme) => (
                  <div key={theme.id} className="flex items-center justify-between">
                    <span className="text-gray-700">{theme.title}</span>
                    <div className="flex items-center space-x-3 w-48">
                      <ProgressBar progress={theme.progress} className="flex-1" />
                      <span className="text-sm font-medium w-12 text-right">
                        {theme.progress}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progression par thème avec leçons et exercices */}
            {(() => {
              // Combiner les thèmes des leçons et exercices
              const allThemes = new Set([
                ...studentProgress.lessons.map(lesson => lessonToTheme[lesson.lesson_id] || 'Autre'),
                ...studentProgress.exercises.map(exercise => exerciseToTheme[exercise.exercise_id] || 'Autre')
              ]);

              return Array.from(allThemes).map(themeName => {
                const themeLessons = studentProgress.lessons.filter(lesson =>
                  (lessonToTheme[lesson.lesson_id] || 'Autre') === themeName
                );
                const themeExercises = studentProgress.exercises.filter(exercise =>
                  (exerciseToTheme[exercise.exercise_id] || 'Autre') === themeName
                );

                return (
                  <div key={themeName} className="mb-6">
                    <h3 className="font-semibold text-lg text-gray-800 mb-4">{themeName}</h3>

                    {/* Leçons du thème */}
                    {themeLessons.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-700 mb-2">Leçons</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full table-auto">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Leçon</th>
                                <th className="px-4 py-2 text-center">Terminée</th>
                                <th className="px-4 py-2 text-center">Score</th>
                                <th className="px-4 py-2 text-center">Tentatives</th>
                                <th className="px-4 py-2 text-center">Dernière tentative</th>
                              </tr>
                            </thead>
                            <tbody>
                              {themeLessons.map((lesson) => (
                                <tr key={lesson.lesson_id} className="border-t">
                                  <td className="px-4 py-2">{lesson.lesson_id}</td>
                                  <td className="px-4 py-2 text-center">
                                    {lesson.completed ? (
                                      <span className="text-green-600">✓</span>
                                    ) : (
                                      <span className="text-red-600">✗</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center">{lesson.score}%</td>
                                  <td className="px-4 py-2 text-center">{lesson.attempts}</td>
                                  <td className="px-4 py-2 text-center">
                                    {new Date(lesson.last_attempt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Exercices du thème */}
                    {themeExercises.length > 0 && (
                      <div>
                        <h4 className="font-medium text-gray-700 mb-2">Exercices</h4>
                        <div className="overflow-x-auto">
                          <table className="min-w-full table-auto">
                            <thead>
                              <tr className="bg-gray-50">
                                <th className="px-4 py-2 text-left">Exercice</th>
                                <th className="px-4 py-2 text-center">Terminé</th>
                                <th className="px-4 py-2 text-center">Score</th>
                                <th className="px-4 py-2 text-center">Tentatives</th>
                                <th className="px-4 py-2 text-center">Dernière tentative</th>
                              </tr>
                            </thead>
                            <tbody>
                              {themeExercises.map((exercise) => (
                                <tr key={exercise.exercise_id} className="border-t">
                                  <td className="px-4 py-2">{exercise.exercise_id}</td>
                                  <td className="px-4 py-2 text-center">
                                    {exercise.completed ? (
                                      <span className="text-green-600">✓</span>
                                    ) : (
                                      <span className="text-red-600">✗</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2 text-center">{exercise.score}%</td>
                                  <td className="px-4 py-2 text-center">{exercise.attempts}</td>
                                  <td className="px-4 py-2 text-center">
                                    {new Date(exercise.last_attempt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        )}
          </>
        )}

        {activeTab === 'content' && (
          <LessonExerciseEditor />
        )}

        {activeTab === 'badges' && (
          <BadgesView />
        )}

        {/* Modals */}
        <CreateClassModal
          isOpen={showCreateClassModal}
          onClose={() => setShowCreateClassModal(false)}
          onClassCreated={() => {
            loadClasses();
            loadOverview();
          }}
        />

        <ManageClassStudentsModal
          isOpen={showManageStudentsModal}
          onClose={() => setShowManageStudentsModal(false)}
          classData={classToManage}
          onStudentsUpdated={() => {
            loadClasses();
            loadOverview();
          }}
        />
      </div>
    </div>
  );
};

export default TeacherDashboard;
