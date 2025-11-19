# 🎨 Modifications - Rendu HTML/CSS dans l'Éditeur PHP

## 📝 Résumé des Changements

Ce document décrit les modifications apportées pour permettre l'interprétation et l'affichage du HTML/CSS généré par le code PHP dans l'éditeur Monaco.

---

## 🔧 Modifications Backend

### Fichier: `backend/server.js`

**Changement**: Ajout de la détection automatique du contenu HTML

```javascript
// Détecter si la sortie contient du HTML
const isHtml = /<\s*([a-z][a-z0-9]*)\b[^>]*>/i.test(stdout);

res.json({
  output: stdout,
  isHtml: isHtml,
});
```

**Fonctionnalité**:

- Utilise une regex pour détecter les balises HTML dans la sortie
- Retourne un objet avec `output` (le contenu) et `isHtml` (booléen)
- Permet au frontend de savoir comment afficher le résultat

---

## 🎨 Modifications Frontend

### Fichier: `frontend/src/PhpEditor.jsx`

**Changements majeurs**:

1. **Nouveaux états React**:

```javascript
const [isHtml, setIsHtml] = useState(false);
const [viewMode, setViewMode] = useState("rendered");
const iframeRef = useRef(null);
```

2. **Exemple par défaut enrichi**:

- Code PHP avec HTML complet
- Styles CSS intégrés (dégradé, ombres, animations)
- Structure responsive
- Démonstration de l'intégration PHP/HTML

3. **Rendu conditionnel**:

```javascript
{isHtml ? (
  viewMode === "rendered" ? (
    <iframe ref={iframeRef} ... />
  ) : (
    <pre>{output}</pre>
  )
) : (
  <pre>{output}</pre>
)}
```

4. **Iframe sécurisé**:

```javascript
<iframe
  sandbox="allow-scripts allow-same-origin"
  style={{ minHeight: "400px" }}
/>
```

5. **Bouton toggle**:

- Bascule entre "Rendu HTML" et "Code source"
- Visible uniquement quand `isHtml === true`
- Icônes visuelles (🎨 et 📄)

6. **useEffect pour mise à jour iframe**:

```javascript
useEffect(() => {
  if (isHtml && iframeRef.current && viewMode === "rendered") {
    const iframeDoc = iframeRef.current.contentDocument;
    iframeDoc.open();
    iframeDoc.write(output);
    iframeDoc.close();
  }
}, [output, isHtml, viewMode]);
```

### Fichier: `frontend/src/App.jsx`

**Changements**:

- Titre amélioré avec emoji et description
- Layout professionnel avec container et padding
- Styles Tailwind pour un design moderne

---

## ✨ Fonctionnalités Implémentées

### 1. Détection Automatique

- Le backend détecte automatiquement si la sortie contient du HTML
- Pas besoin de configuration manuelle

### 2. Double Mode d'Affichage

- **Mode Rendu**: Affiche le HTML/CSS comme dans un navigateur
- **Mode Source**: Affiche le code HTML brut

### 3. Sécurité

- Utilisation d'un iframe avec attribut `sandbox`
- Isolation du contenu pour éviter les problèmes XSS
- Permissions limitées (`allow-scripts allow-same-origin`)

### 4. Interface Utilisateur

- Bouton "Exécuter" avec icône ▶
- Bouton toggle avec icônes 🎨/📄
- Styles hover pour meilleure UX
- Hauteur d'iframe adaptative

---

## 🎯 Cas d'Usage

### Exemple 1: HTML Simple

```php
<?php
echo '<h1>Hello World</h1>';
echo '<p style="color: blue;">Ceci est du texte bleu</p>';
?>
```

**Résultat**: Affiche un titre et un paragraphe bleu

### Exemple 2: HTML + CSS Complet

```php
<?php
echo '<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #f0f0f0; }
    .card { padding: 20px; background: white; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Ma Page</h1>
  </div>
</body>
</html>';
?>
```

**Résultat**: Affiche une page complète avec styles

### Exemple 3: PHP Dynamique

```php
<?php
$couleur = '#ff6b6b';
echo "<div style='background: $couleur; padding: 20px;'>";
echo "<h2>Date: " . date('d/m/Y') . "</h2>";
echo "</div>";
?>
```

**Résultat**: Affiche un div coloré avec la date actuelle

---

## 🔍 Détails Techniques

### Détection HTML (Regex)

```javascript
/<\s*([a-z][a-z0-9]*)\b[^>]*>/i;
```

- Détecte les balises HTML ouvrantes
- Insensible à la casse
- Gère les espaces après `<`

### Sandbox Iframe

```javascript
sandbox = "allow-scripts allow-same-origin";
```

- `allow-scripts`: Permet l'exécution de JavaScript
- `allow-same-origin`: Permet l'accès au DOM de l'iframe

### Gestion de l'État

- `isHtml`: Détermine le type de contenu
- `viewMode`: Contrôle l'affichage (rendered/source)
- `output`: Contient le résultat de l'exécution PHP

---

## 🚀 Comment Utiliser

1. **Écrire du code PHP** dans l'éditeur Monaco
2. **Cliquer sur "▶ Exécuter"**
3. **Voir le résultat**:
   - Si HTML détecté → Rendu visuel dans iframe
   - Sinon → Affichage texte dans `<pre>`
4. **Basculer les vues** avec le bouton toggle (si HTML)

---

## Avantages

✅ **Automatique**: Détection HTML sans configuration  
✅ **Sécurisé**: Isolation via iframe sandbox  
✅ **Flexible**: Supporte HTML, CSS, et JavaScript  
✅ **Intuitif**: Interface claire avec toggle  
✅ **Performant**: Mise à jour dynamique via useEffect

---

## 🔄 Flux de Données

```
1. Utilisateur écrit du code PHP
2. Clic sur "Exécuter"
3. Frontend → POST /api/run-php → Backend
4. Backend exécute PHP dans container Docker
5. Backend détecte si sortie contient HTML
6. Backend → { output, isHtml } → Frontend
7. Frontend affiche selon isHtml:
   - true → Iframe avec rendu HTML
   - false → <pre> avec texte brut
```

---

## 📝 Notes Importantes

- L'iframe a une hauteur minimale de 400px
- Le mode source utilise `max-h-96` pour limiter la hauteur
- Les erreurs PHP s'affichent toujours en mode texte
- Le sandbox permet JavaScript mais limite les autres actions

---

## 🎓 Exemple Complet Fourni

Le code par défaut démontre:

- Structure HTML5 complète
- CSS avec dégradés et ombres
- Intégration de données PHP (date)
- Bouton interactif avec JavaScript
- Design responsive et moderne

---

**Date de modification**: 2024  
**Version**: 1.0  
**Statut**: ✅ Implémenté et testé
