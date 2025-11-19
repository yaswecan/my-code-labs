# TODO - Implémentation Classes Multiples

## Backend

- [ ] Créer table `classes` dans db.js
- [ ] Ajouter champ `class_id` dans table `users`
- [ ] Nouveaux endpoints dans server.js :
  - [ ] GET /api/classes - Liste des classes
  - [ ] POST /api/classes - Créer une classe
  - [ ] GET /api/classes/:id/students - Élèves d'une classe
  - [ ] GET /api/classes/:id/overview - Aperçu d'une classe
  - [ ] PUT /api/classes/:id/students - Assigner élèves à une classe
- [ ] Modifier endpoints existants pour filtrer par classe

## Frontend

- [ ] Modifier TeacherDashboard.jsx pour vue multi-classes
- [ ] Interface création de classes
- [ ] Interface gestion élèves par classe

## Tests

- [ ] Tester création de classes
- [ ] Tester assignation élèves
- [ ] Tester aperçus par classe
