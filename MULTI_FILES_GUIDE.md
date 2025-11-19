# 📁 Guide - Système Multi-Fichiers

## 🎯 Vue d'Ensemble

Le nouvel éditeur multi-fichiers permet de créer des projets PHP complets avec plusieurs fichiers (PHP, CSS, JavaScript, HTML) qui peuvent interagir entre eux.

---

## ✨ Fonctionnalités

### 1. **Gestion des Fichiers**

- ✅ Créer plusieurs fichiers
- ✅ Supprimer des fichiers
- ✅ Renommer des fichiers
- ✅ Naviguer entre fichiers via onglets
- ✅ Détection automatique du langage selon l'extension

### 2. **Types de Fichiers Supportés**

- **`.php`** - Fichiers PHP (langage principal)
- **`.css`** - Feuilles de style CSS
- **`.js`** - Scripts JavaScript
- **`.html`** - Pages HTML

### 3. **Interactions entre Fichiers**

- ✅ `include` / `require` PHP entre fichiers
- ✅ Liens CSS via `<link rel="stylesheet" href="style.css">`
- ✅ Scripts JS via `<script src="script.js"></script>`
- ✅ Tous les fichiers dans le même dossier de projet

---

## 🚀 Utilisation

### Interface Utilisateur

#### Barre d'Onglets (en haut)

```
[index.php   ✕] [style.css   ✕] [script.js   ✕] [+ Nouveau fichier]
```

- **Cliquer sur un onglet**: Ouvrir le fichier
- ** (Renommer)**: Changer le nom du fichier
- **✕ (Supprimer)**: Supprimer le fichier
- **+ Nouveau fichier**: Créer un nouveau fichier

#### Éditeur de Code (centre)

- Éditeur Monaco avec coloration syntaxique
- Autocomplétion
- Numéros de ligne

#### Barre d'Actions (bas de l'éditeur)

- **▶ Exécuter le Projet**: Lance l'exécution
- **🎨/📄 Toggle**: Bascule entre rendu et code source (si HTML)
- **Info**: Nombre de fichiers et fichier actif

#### Zone de Résultat (bas)

- Affiche le rendu HTML ou le texte brut
- Hauteur: 40% de l'écran

---

## 📝 Exemples d'Utilisation

### Exemple 1: Projet Simple avec CSS

**Fichier: index.php**

```php
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Mon Site</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Bienvenue!</h1>
    <p>Date: <?php echo date('d/m/Y'); ?></p>
  </div>
</body>
</html>
```

**Fichier: style.css**

```css
body {
  font-family: Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
}

.container {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #667eea;
}
```

**Résultat**: Page web stylisée avec dégradé de fond

---

### Exemple 2: Projet avec JavaScript

**Fichier: index.php**

```php
<!DOCTYPE html>
<html>
<head>
  <title>Compteur</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="container">
    <h1>Compteur</h1>
    <p id="counter">0</p>
    <button onclick="increment()">+1</button>
    <button onclick="decrement()">-1</button>
  </div>
  <script src="script.js"></script>
</body>
</html>
```

**Fichier: style.css**

```css
.container {
  text-align: center;
  padding: 40px;
}

#counter {
  font-size: 48px;
  font-weight: bold;
  color: #667eea;
}

button {
  padding: 10px 20px;
  margin: 5px;
  font-size: 16px;
  cursor: pointer;
}
```

**Fichier: script.js**

```javascript
let count = 0;

function increment() {
  count++;
  document.getElementById("counter").textContent = count;
}

function decrement() {
  count--;
  document.getElementById("counter").textContent = count;
}
```

**Résultat**: Application de compteur interactive

---

### Exemple 3: Projet avec Includes PHP

**Fichier: index.php**

```php
<?php
include 'config.php';
include 'functions.php';
?>
<!DOCTYPE html>
<html>
<head>
  <title><?php echo SITE_NAME; ?></title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1><?php echo getWelcomeMessage(); ?></h1>
  <p>Version: <?php echo SITE_VERSION; ?></p>
</body>
</html>
```

**Fichier: config.php**

```php
<?php
define('SITE_NAME', 'Mon Super Site');
define('SITE_VERSION', '1.0.0');
?>
```

**Fichier: functions.php**

```php
<?php
function getWelcomeMessage() {
  $hour = date('H');
  if ($hour < 12) {
    return 'Bonjour!';
  } elseif ($hour < 18) {
    return 'Bon après-midi!';
  } else {
    return 'Bonsoir!';
  }
}
?>
```

**Fichier: style.css**

```css
body {
  font-family: Arial, sans-serif;
  padding: 20px;
}
```

**Résultat**: Site avec configuration et fonctions séparées

---

### Exemple 4: Projet Complet (Blog)

**Fichier: index.php**

```php
<?php
include 'data.php';
?>
<!DOCTYPE html>
<html>
<head>
  <title>Mon Blog</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>📝 Mon Blog</h1>
  </header>

  <main>
    <?php foreach ($articles as $article): ?>
      <article class="post">
        <h2><?php echo $article['title']; ?></h2>
        <p class="date"><?php echo $article['date']; ?></p>
        <p><?php echo $article['content']; ?></p>
      </article>
    <?php endforeach; ?>
  </main>

  <script src="script.js"></script>
</body>
</html>
```

**Fichier: data.php**

```php
<?php
$articles = [
  [
    'title' => 'Premier Article',
    'date' => '01/01/2024',
    'content' => 'Contenu du premier article...'
  ],
  [
    'title' => 'Deuxième Article',
    'date' => '02/01/2024',
    'content' => 'Contenu du deuxième article...'
  ]
];
?>
```

**Fichier: style.css**

```css
body {
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  background: #f5f5f5;
}

header {
  background: #667eea;
  color: white;
  padding: 20px;
  border-radius: 10px;
  text-align: center;
  margin-bottom: 30px;
}

.post {
  background: white;
  padding: 20px;
  margin-bottom: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}

.post h2 {
  color: #667eea;
  margin-top: 0;
}

.date {
  color: #999;
  font-size: 14px;
}
```

**Fichier: script.js**

```javascript
console.log("Blog loaded!");

// Ajouter un effet au survol des articles
document.addEventListener("DOMContentLoaded", function () {
  const posts = document.querySelectorAll(".post");

  posts.forEach((post) => {
    post.addEventListener("mouseenter", function () {
      this.style.transform = "scale(1.02)";
      this.style.transition = "transform 0.3s";
    });

    post.addEventListener("mouseleave", function () {
      this.style.transform = "scale(1)";
    });
  });
});
```

**Résultat**: Blog complet avec articles, styles et interactions

---

## 🔧 Fonctionnalités Techniques

### Backend API

**Endpoint**: `POST /api/run-project`

**Format de Requête**:

```json
{
  "files": [
    {
      "name": "index.php",
      "content": "<?php echo 'Hello'; ?>"
    },
    {
      "name": "style.css",
      "content": "body { background: #fff; }"
    }
  ],
  "entryPoint": "index.php"
}
```

**Format de Réponse**:

```json
{
  "output": "<html>...</html>",
  "isHtml": true
}
```

### Processus d'Exécution

1. **Création du Projet**

   - Dossier unique: `/sandbox/project_[timestamp]/`
   - Tous les fichiers écrits dans ce dossier

2. **Exécution**

   - Le fichier `entryPoint` (généralement `index.php`) est exécuté
   - Les autres fichiers sont accessibles via `include`, `require`, `<link>`, `<script>`

3. **Nettoyage**
   - Le dossier du projet est supprimé après exécution
   - Pas de fichiers orphelins

---

## 💡 Bonnes Pratiques

### 1. Organisation des Fichiers

```
index.php       # Point d'entrée principal
config.php      # Configuration
functions.php   # Fonctions utilitaires
data.php        # Données
style.css       # Styles
script.js       # Scripts
```

### 2. Nommage des Fichiers

- ✅ Utilisez des noms descriptifs: `user-functions.php`, `main-style.css`
- ✅ Évitez les espaces: utilisez `-` ou `_`
- ✅ Extensions correctes: `.php`, `.css`, `.js`, `.html`

### 3. Includes PHP

```php
// Bon
include 'functions.php';
require 'config.php';

// Éviter (chemins absolus ne fonctionneront pas)
include '/var/www/functions.php';
```

### 4. Liens CSS/JS

```html
<!-- Bon -->
<link rel="stylesheet" href="style.css" />
<script src="script.js"></script>

<!-- Éviter (chemins absolus) -->
<link rel="stylesheet" href="/css/style.css" />
```

---

## ⚠️ Limitations

- ❌ Pas de sous-dossiers (tous les fichiers au même niveau)
- ❌ Pas d'upload de fichiers externes
- ❌ Pas d'accès aux bases de données
- ❌ Pas de sessions PHP persistantes
- ⏱️ Timeout: 10 secondes par exécution

---

## 🎨 Raccourcis Clavier

| Action       | Raccourci                |
| ------------ | ------------------------ |
| Sauvegarder  | Ctrl+S (auto-sauvegarde) |
| Rechercher   | Ctrl+F                   |
| Remplacer    | Ctrl+H                   |
| Commenter    | Ctrl+/                   |
| Indenter     | Tab                      |
| Dés-indenter | Shift+Tab                |

---

## 🐛 Dépannage

### Le fichier CSS ne s'applique pas

**Problème**: Les styles ne sont pas visibles

**Solution**:

- Vérifiez le nom du fichier dans `<link href="...">`
- Assurez-vous que le fichier CSS existe
- Vérifiez la syntaxe CSS

### Les includes PHP ne fonctionnent pas

**Problème**: `Warning: include(): Failed opening...`

**Solution**:

- Vérifiez le nom exact du fichier (sensible à la casse)
- Utilisez le nom simple: `include 'file.php'` (pas de chemin)
- Assurez-vous que le fichier existe dans le projet

### Le JavaScript ne s'exécute pas

**Problème**: Les fonctions JS ne sont pas définies

**Solution**:

- Vérifiez que `<script src="script.js">` est présent
- Placez le script avant `</body>` pour accéder au DOM
- Vérifiez la console du navigateur pour les erreurs

---

## Exemples Prêts à l'Emploi

L'éditeur charge automatiquement un projet exemple avec:

- ✅ `index.php` - Page principale avec HTML
- ✅ `style.css` - Styles avec dégradé
- ✅ `script.js` - Script interactif

Vous pouvez le modifier ou créer votre propre projet!

---

## 🚀 Prochaines Étapes

Fonctionnalités potentielles futures:

- [ ] Support des sous-dossiers
- [ ] Import/Export de projets
- [ ] Templates de projets
- [ ] Prévisualisation en temps réel
- [ ] Historique des versions
- [ ] Collaboration en temps réel

---

**Version**: 2.0  
**Date**: 2024  
**Statut**: ✅ Opérationnel
