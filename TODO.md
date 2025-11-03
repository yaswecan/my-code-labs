# TODO - Système d'Authentification et Suivi de Progression

## ✅ Complété

### Backend

- [x] Remplacer PostgreSQL par MySQL dans docker-compose.yml
- [x] Ajouter les dépendances (mysql2, jsonwebtoken, bcryptjs)
- [x] Créer backend/db.js pour la configuration MySQL
- [x] Créer backend/auth.js avec les fonctions d'authentification
- [x] Initialiser les tables (users, progress, lesson_progress)
- [x] Ajouter les routes d'authentification (/api/auth/register, /api/auth/login)
- [x] Protéger les endpoints avec authenticateToken middleware
- [x] Mettre à jour la progression lors des tests (leçons et exercices)
- [x] Calculer la progression par partie

### Frontend

- [x] Créer AuthContext.jsx pour gérer l'état d'authentification
- [x] Créer Login.jsx (composant de connexion)
- [x] Créer Register.jsx (composant d'inscription)
- [x] Mettre à jour main.jsx avec AuthProvider
- [x] Mettre à jour App.jsx pour afficher login/register si non connecté
- [x] Ajouter bouton de déconnexion dans la navigation
- [x] Mettre à jour ThemeView.jsx pour utiliser les headers d'auth
- [x] Mettre à jour LearningMode.jsx pour utiliser les headers d'auth
- [x] Afficher la progression réelle dans ThemeView

## 🔄 À faire

### Tests Fonctionnels

- [ ] Ouvrir http://localhost:5173 dans un navigateur
- [ ] Créer un compte utilisateur (inscription)
- [ ] Se connecter avec les identifiants
- [ ] Naviguer vers les thèmes d'apprentissage
- [ ] Commencer une leçon et la compléter pour voir la progression
- [ ] Tester un exercice et vérifier la mise à jour de la progression
- [ ] Vérifier que la barre de progression s'affiche correctement

### Améliorations futures (optionnel)

- [ ] Ajouter un tableau de bord utilisateur avec statistiques
- [ ] Ajouter la possibilité de réinitialiser le mot de passe
- [ ] Ajouter des badges/récompenses pour la progression
- [ ] Ajouter un classement entre étudiants
- [ ] Exporter les données de progression

## 📝 Notes

- La base de données MySQL est automatiquement initialisée au démarrage du backend
- Les tables sont créées automatiquement par backend/db.js
- Le token JWT est stocké dans localStorage et expire après 7 jours
- La progression est calculée en temps réel basée sur les exercices/leçons complétés
- L'application est maintenant accessible sur http://localhost:5173

## 🚀 Prêt pour les tests !

L'application est maintenant déployée avec succès. Vous pouvez commencer les tests fonctionnels pour vérifier que l'authentification et le suivi de progression fonctionnent correctement.
