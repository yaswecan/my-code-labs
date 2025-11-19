import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext.jsx';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const LessonExerciseEditor = () => {
  const { getAuthHeaders } = useAuth();
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState(null);
  const [selectedPart, setSelectedPart] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editorContent, setEditorContent] = useState('');
  const [editorKey, setEditorKey] = useState(0);
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const [showNewThemeModal, setShowNewThemeModal] = useState(false);
  const [showNewPartModal, setShowNewPartModal] = useState(false);
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [newThemeForm, setNewThemeForm] = useState({ title: '', description: '' });
  const [newPartForm, setNewPartForm] = useState({ title: '' });
  const [newItemForm, setNewItemForm] = useState({ type: 'lesson', title: '', id: '' });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/themes', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setThemes(data);
      } else {
        console.error('Erreur chargement thèmes:', response.status);
      }
    } catch (error) {
      console.error('Erreur chargement thèmes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleThemeSelect = (theme) => {
    setSelectedTheme(theme);
    setSelectedPart(null);
    setSelectedItem(null);
  };

  const handlePartSelect = (part) => {
    setSelectedPart(part);
    setSelectedItem(null);
  };

  const handleItemSelect = (item) => {
    setSelectedItem(item);
    setEditForm({ ...item });
    setEditorContent(item.content || item.instructions || '');
    setEditorKey(prev => prev + 1);
    setIsEditing(false);

    // Force update of editor content
    setTimeout(() => {
      if (editorInstanceRef.current) {
        const editor = editorInstanceRef.current;
        if (editor) {
          const content = item.content || item.instructions || '';
          editor.setData(content);
        }
      }
    }, 100);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Ensure we have the latest content from the editor
      let finalEditForm = { ...editForm };

      // If we have an editor reference, get the current content
      if (editorInstanceRef.current) {
        const currentContent = editorInstanceRef.current.getData();
        if (selectedItem.type === 'lesson') {
          finalEditForm.content = currentContent;
        } else {
          finalEditForm.instructions = currentContent;
        }
      }

      console.log('Saving item:', finalEditForm);

      // Mettre à jour localement d'abord
      let updatedThemes;
      if (selectedItem.type === 'lesson') {
        // Update lesson in themes
        updatedThemes = themes.map(theme => {
          if (theme.id === selectedTheme.id) {
            return {
              ...theme,
              parts: theme.parts.map(part => {
                if (part.id === selectedPart.id) {
                  return {
                    ...part,
                    content: part.content.map(item =>
                      item.id === selectedItem.id ? finalEditForm : item
                    )
                  };
                }
                return part;
              })
            };
          }
          return theme;
        });
      } else {
        // Update exercise
        updatedThemes = themes.map(theme => {
          if (theme.id === selectedTheme.id) {
            return {
              ...theme,
              parts: theme.parts.map(part => {
                if (part.id === selectedPart.id) {
                  return {
                    ...part,
                    content: part.content.map(item =>
                      item.id === selectedItem.id ? finalEditForm : item
                    )
                  };
                }
                return part;
              })
            };
          }
          return theme;
        });
      }

      // Sauvegarder vers le backend
      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ themes: updatedThemes }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      // Update local state only after successful backend save
      setThemes(updatedThemes);
      setIsEditing(false);
      setSelectedItem(finalEditForm);
      setEditorKey(prev => prev + 1);

      console.log('Save successful');
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm({ ...selectedItem });
    setIsEditing(false);
    setEditorKey(prev => prev + 1);
  };

  const handleFormChange = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleOptionsChange = (index, value) => {
    const newOptions = [...editForm.options];
    newOptions[index] = value;
    setEditForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setEditForm(prev => ({
      ...prev,
      options: [...(prev.options || []), '']
    }));
  };

  const removeOption = (index) => {
    const newOptions = editForm.options.filter((_, i) => i !== index);
    setEditForm(prev => ({ ...prev, options: newOptions }));
  };

  const handleCreateTheme = async () => {
    if (!newThemeForm.title.trim()) {
      alert('Le titre du thème est requis');
      return;
    }

    const newTheme = {
      id: `theme_${Date.now()}`,
      title: newThemeForm.title.trim(),
      description: newThemeForm.description.trim(),
      parts: []
    };

    const updatedThemes = [...themes, newTheme];
    setThemes(updatedThemes);

    try {
      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ themes: updatedThemes }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setShowNewThemeModal(false);
      setNewThemeForm({ title: '', description: '' });
    } catch (error) {
      console.error('Erreur sauvegarde thème:', error);
      alert('Erreur lors de la création du thème: ' + error.message);
      // Recharger les thèmes pour annuler les changements locaux
      loadThemes();
    }
  };

  const handleCreatePart = async () => {
    if (!selectedTheme || !newPartForm.title.trim()) {
      alert('Le titre de la partie est requis');
      return;
    }

    const newPart = {
      id: `part_${Date.now()}`,
      title: newPartForm.title.trim(),
      content: []
    };

    const updatedThemes = themes.map(theme =>
      theme.id === selectedTheme.id
        ? { ...theme, parts: [...theme.parts, newPart] }
        : theme
    );
    setThemes(updatedThemes);

    try {
      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ themes: updatedThemes }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setShowNewPartModal(false);
      setNewPartForm({ title: '' });
    } catch (error) {
      console.error('Erreur sauvegarde partie:', error);
      alert('Erreur lors de la création de la partie: ' + error.message);
      loadThemes();
    }
  };

  const handleCreateItem = async () => {
    if (!selectedPart || !newItemForm.title.trim() || !newItemForm.id.trim()) {
      alert('Le titre et l\'ID sont requis');
      return;
    }

    const newItem = {
      id: newItemForm.id.trim(),
      type: newItemForm.type,
      title: newItemForm.title.trim(),
      ...(newItemForm.type === 'lesson' ? {
        content: '',
        question: '',
        testType: 'mcq',
        options: ['Option 1', 'Option 2', 'Option 3'],
        correctAnswer: 0
      } : {
        difficulty: 'beginner',
        category: '',
        description: '',
        instructions: '',
        initialCode: '',
        expectedOutput: '',
        hints: []
      })
    };

    const updatedThemes = themes.map(theme =>
      theme.id === selectedTheme.id
        ? {
            ...theme,
            parts: theme.parts.map(part =>
              part.id === selectedPart.id
                ? { ...part, content: [...part.content, newItem] }
                : part
            )
          }
        : theme
    );
    setThemes(updatedThemes);

    try {
      const response = await fetch('/api/themes', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ themes: updatedThemes }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde');
      }

      setShowNewItemModal(false);
      setNewItemForm({ type: 'lesson', title: '', id: '' });
    } catch (error) {
      console.error('Erreur sauvegarde item:', error);
      alert('Erreur lors de la création de l\'élément: ' + error.message);
      loadThemes();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Chargement de l'éditeur...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">
            Éditeur de Leçons et Exercices
          </h1>
          <div className="flex space-x-2">
            <button
              onClick={loadThemes}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Actualiser
            </button>
            <button
              onClick={() => setShowNewThemeModal(true)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              + Nouveau Thème
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-lg font-semibold mb-4">Navigation</h2>

              {/* Thèmes */}
              <div className="mb-4">
                <h3 className="font-medium mb-2">Thèmes</h3>
                <div className="space-y-1">
                  {themes.map(theme => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeSelect(theme)}
                      className={`w-full text-left px-3 py-2 rounded text-sm ${
                        selectedTheme?.id === theme.id
                          ? 'bg-blue-100 text-blue-800'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {theme.title}
                    </button>
                  ))}
                </div>
              </div>

              {/* Parties */}
              {selectedTheme && (
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Parties</h3>
                    <button
                      onClick={() => setShowNewPartModal(true)}
                      className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                    >
                      + Nouvelle Partie
                    </button>
                  </div>
                  <div className="space-y-1">
                    {selectedTheme.parts.map(part => (
                      <button
                        key={part.id}
                        onClick={() => handlePartSelect(part)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedPart?.id === part.id
                            ? 'bg-green-100 text-green-800'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {part.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Contenu */}
              {selectedPart && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-medium">Contenu</h3>
                    <button
                      onClick={() => setShowNewItemModal(true)}
                      className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                    >
                      + Nouvel Élément
                    </button>
                  </div>
                  <div className="space-y-1">
                    {selectedPart.content.map(item => (
                      <button
                        key={item.id}
                        onClick={() => handleItemSelect(item)}
                        className={`w-full text-left px-3 py-2 rounded text-sm ${
                          selectedItem?.id === item.id
                            ? 'bg-purple-100 text-purple-800'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          item.type === 'lesson' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></span>
                        {item.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Éditeur */}
          <div className="lg:col-span-3">
            {selectedItem ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {selectedItem.type === 'lesson' ? 'Leçon' : 'Exercice'}: {selectedItem.title}
                    </h2>
                    <p className="text-gray-600">
                      {selectedTheme.title} → {selectedPart.title}
                    </p>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={handleEdit}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        Modifier
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-6">
                    {/* Champs communs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre
                        </label>
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => handleFormChange('title', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID
                        </label>
                        <input
                          type="text"
                          value={editForm.id || ''}
                          onChange={(e) => handleFormChange('id', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>

                    {/* Contenu pour leçons */}
                    {selectedItem.type === 'lesson' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contenu (Éditeur riche)
                          </label>
                          <CKEditor
                            key={editorKey}
                            ref={editorRef}
                            editor={ClassicEditor}
                            data={editForm.content || ''}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              handleFormChange('content', data);
                            }}
                            onReady={(editor) => {
                              // Store editor instance
                              editorInstanceRef.current = editor;
                            }}
                            config={{
                              height: 400,
                              toolbar: [
                                'heading', '|',
                                'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                                'indent', 'outdent', '|',
                                'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo'
                              ],
                              ckfinder: {
                                uploadUrl: '/api/upload-image'
                              },
                              mediaEmbed: {
                                previewsInData: true
                              }
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <input
                            type="text"
                            value={editForm.question || ''}
                            onChange={(e) => handleFormChange('question', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de test
                          </label>
                          <select
                            value={editForm.testType || 'mcq'}
                            onChange={(e) => handleFormChange('testType', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="mcq">QCM</option>
                            <option value="text">Texte libre</option>
                          </select>
                        </div>

                        {editForm.testType === 'mcq' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options
                            </label>
                            {editForm.options?.map((option, index) => (
                              <div key={index} className="flex items-center mb-2">
                                <input
                                  type="radio"
                                  name="correctAnswer"
                                  checked={editForm.correctAnswer === index}
                                  onChange={() => handleFormChange('correctAnswer', index)}
                                  className="mr-2"
                                />
                                <input
                                  type="text"
                                  value={option}
                                  onChange={(e) => handleOptionsChange(index, e.target.value)}
                                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder={`Option ${index + 1}`}
                                />
                                <button
                                  onClick={() => removeOption(index)}
                                  className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={addOption}
                              className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                            >
                              + Ajouter une option
                            </button>
                          </div>
                        )}
                      </>
                    )}

                    {/* Contenu pour exercices */}
                    {selectedItem.type === 'exercise' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Difficulté
                            </label>
                            <select
                              value={editForm.difficulty || 'beginner'}
                              onChange={(e) => handleFormChange('difficulty', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="beginner">Débutant</option>
                              <option value="intermediate">Intermédiaire</option>
                              <option value="advanced">Avancé</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Catégorie
                            </label>
                            <input
                              type="text"
                              value={editForm.category || ''}
                              onChange={(e) => handleFormChange('category', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <input
                              type="text"
                              value={editForm.description || ''}
                              onChange={(e) => handleFormChange('description', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions (Éditeur riche)
                          </label>
                          <CKEditor
                            key={`instructions-${editorKey}`}
                            editor={ClassicEditor}
                            data={editForm.instructions || ''}
                            onChange={(event, editor) => {
                              const data = editor.getData();
                              handleFormChange('instructions', data);
                            }}
                            config={{
                              height: 300,
                              toolbar: [
                                'heading', '|',
                                'bold', 'italic', 'link', 'bulletedList', 'numberedList', '|',
                                'indent', 'outdent', '|',
                                'imageUpload', 'blockQuote', 'insertTable', 'mediaEmbed', 'undo', 'redo'
                              ],
                              ckfinder: {
                                uploadUrl: '/api/upload-image'
                              },
                            }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code initial
                          </label>
                          <textarea
                            value={editForm.initialCode || ''}
                            onChange={(e) => handleFormChange('initialCode', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Code PHP initial..."
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sortie attendue
                          </label>
                          <textarea
                            value={editForm.expectedOutput || ''}
                            onChange={(e) => handleFormChange('expectedOutput', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                            placeholder="Résultat attendu..."
                          />
                        </div>
                      </>
                    )}

                    {/* Boutons de sauvegarde */}
                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={handleCancel}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        disabled={saving}
                      >
                        Annuler
                      </button>
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        disabled={saving}
                      >
                        {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Affichage en lecture seule */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Titre
                        </label>
                        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          {selectedItem.title}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          ID
                        </label>
                        <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                          {selectedItem.id}
                        </p>
                      </div>
                    </div>

                    {/* Contenu pour leçons */}
                    {selectedItem.type === 'lesson' && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Contenu
                          </label>
                          <div
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedItem.content || '' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Question
                          </label>
                          <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                            {selectedItem.question || 'Aucune question'}
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Type de test
                          </label>
                          <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                            {selectedItem.testType === 'mcq' ? 'QCM' : 'Texte libre'}
                          </p>
                        </div>

                        {selectedItem.testType === 'mcq' && selectedItem.options && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Options
                            </label>
                            {selectedItem.options.map((option, index) => (
                              <div key={index} className="flex items-center mb-2">
                                <input
                                  type="radio"
                                  checked={selectedItem.correctAnswer === index}
                                  readOnly
                                  className="mr-2"
                                />
                                <span className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md flex-1">
                                  {option}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}

                    {/* Contenu pour exercices */}
                    {selectedItem.type === 'exercise' && (
                      <>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Difficulté
                            </label>
                            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {selectedItem.difficulty === 'beginner' ? 'Débutant' :
                               selectedItem.difficulty === 'intermediate' ? 'Intermédiaire' : 'Avancé'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Catégorie
                            </label>
                            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {selectedItem.category || 'Non spécifiée'}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Description
                            </label>
                            <p className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md">
                              {selectedItem.description || 'Aucune description'}
                            </p>
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Instructions
                          </label>
                          <div
                            className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md prose max-w-none"
                            dangerouslySetInnerHTML={{ __html: selectedItem.instructions || '' }}
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Code initial
                          </label>
                          <pre className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto text-sm">
                            <code>{selectedItem.initialCode || 'Aucun code initial'}</code>
                          </pre>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Sortie attendue
                          </label>
                          <pre className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md overflow-x-auto text-sm">
                            <code>{selectedItem.expectedOutput || 'Aucune sortie attendue'}</code>
                          </pre>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ) : selectedTheme && !selectedPart ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Parties du thème: {selectedTheme.title}
                  </h2>
                  <button
                    onClick={() => setShowNewPartModal(true)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    + Nouvelle Partie
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedTheme.parts.map(part => (
                    <div
                      key={part.id}
                      onClick={() => handlePartSelect(part)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <h3 className="text-lg font-semibold text-gray-800">{part.title}</h3>
                      <p className="text-gray-600">{part.content.length} élément(s)</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : selectedPart && !selectedItem ? (
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">
                    Éléments de la partie: {selectedPart.title}
                  </h2>
                  <button
                    onClick={() => setShowNewItemModal(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    + Ajouter un élément
                  </button>
                </div>
                <div className="space-y-4">
                  {selectedPart.content.map(item => (
                    <div
                      key={item.id}
                      onClick={() => handleItemSelect(item)}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center">
                        <span className={`inline-block w-3 h-3 rounded-full mr-3 ${
                          item.type === 'lesson' ? 'bg-blue-500' : 'bg-green-500'
                        }`}></span>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">{item.title}</h3>
                          <p className="text-gray-600">{item.type === 'lesson' ? 'Leçon' : 'Exercice'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6 text-center">
                <div className="text-6xl mb-4">📝</div>
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  Sélectionnez un élément
                </h3>
                <p className="text-gray-500">
                  Choisissez un thème, une partie et un élément dans le panneau de navigation pour commencer l'édition.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modals */}
        {/* Modal Nouveau Thème */}
        {showNewThemeModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nouveau Thème</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newThemeForm.title}
                    onChange={(e) => setNewThemeForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre du thème"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newThemeForm.description}
                    onChange={(e) => setNewThemeForm(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Description du thème"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewThemeModal(false);
                    setNewThemeForm({ title: '', description: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateTheme}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nouvelle Partie */}
        {showNewPartModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nouvelle Partie</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newPartForm.title}
                    onChange={(e) => setNewPartForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de la partie"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewPartModal(false);
                    setNewPartForm({ title: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreatePart}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Nouvel Élément */}
        {showNewItemModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Nouvel Élément</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={newItemForm.type}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="lesson">Leçon</option>
                    <option value="exercise">Exercice</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Titre
                  </label>
                  <input
                    type="text"
                    value={newItemForm.title}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Titre de l'élément"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ID
                  </label>
                  <input
                    type="text"
                    value={newItemForm.id}
                    onChange={(e) => setNewItemForm(prev => ({ ...prev, id: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="ID unique (ex: lesson1, exercise1)"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowNewItemModal(false);
                    setNewItemForm({ type: 'lesson', title: '', id: '' });
                  }}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                >
                  Annuler
                </button>
                <button
                  onClick={handleCreateItem}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                >
                  Créer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonExerciseEditor;
