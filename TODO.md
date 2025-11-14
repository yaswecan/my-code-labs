# TODO - Système de Badges

## Backend

- [x] Ajouter tables `badges` et `user_badges` dans db.js
- [x] Créer badges par défaut pour chaque thème dans initDB
- [x] Ajouter fonctions de gestion des badges dans auth.js
- [x] Modifier updateExerciseProgress et updateLessonProgress pour vérifier attribution badges
- [x] Ajouter endpoints API pour récupérer les badges utilisateur

## Frontend

- [x] Créer composant BadgesView.jsx pour afficher les badges
- [x] Ajouter navigation vers "Mes Badges" dans App.jsx
- [x] Intégrer affichage badges dans ThemeView.jsx (notification quand badge gagné)

## Tests

- [x] Tester attribution automatique des badges
- [x] Vérifier affichage des badges dans l'interface
- [x] Tester avec plusieurs utilisateurs

## Améliorations futures

- [x] Interface admin pour gérer les badges
- [x] Badges pour autres achievements (premier exercice, streak, etc.)
- [x] Notifications en temps réel
