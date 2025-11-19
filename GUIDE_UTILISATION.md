# 📖 Guide d'Utilisation - Éditeur PHP avec Rendu HTML/CSS

## 🚀 Démarrage Rapide

### 1. Lancer l'Application

```bash
docker-compose up -d
```

### 2. Accéder à l'Application

Ouvrez votre navigateur et allez sur: **http://localhost:5173**

---

## 💻 Utilisation de l'Éditeur

### Interface Principale

L'éditeur se compose de trois parties:

1. **Éditeur de Code** (Monaco Editor)

   - Zone de saisie du code PHP
   - Coloration syntaxique automatique
   - Autocomplétion

2. **Boutons d'Action**

   - **▶ Exécuter**: Lance l'exécution du code PHP
   - **🎨/📄 Toggle**: Bascule entre rendu HTML et code source (visible uniquement si HTML détecté)

3. **Zone de Résultat**
   - Affiche le rendu HTML (si HTML détecté)
   - Affiche le texte brut (si pas de HTML)

---

## 📝 Exemples d'Utilisation

### Exemple 1: PHP Simple (Texte)

```php
<?php
echo "Hello World!";
?>
```

**Résultat**: Affiche "Hello World!" en texte brut

---

### Exemple 2: HTML Simple

```php
<?php
echo "<h1>Mon Titre</h1>";
echo "<p>Mon paragraphe</p>";
?>
```

**Résultat**: Affiche un titre et un paragraphe rendus visuellement

---

### Exemple 3: HTML avec CSS Inline

```php
<?php
echo '<div style="background: #4CAF50; color: white; padding: 20px; border-radius: 10px;">';
echo '<h2>Boîte Verte</h2>';
echo '<p>Ceci est un exemple avec du CSS inline</p>';
echo '</div>';
?>
```

**Résultat**: Affiche une boîte verte stylisée

---

### Exemple 4: Document HTML Complet

```php
<?php
echo '<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 20px;
    }
    .card {
      background: white;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      max-width: 600px;
      margin: 0 auto;
    }
    h1 {
      color: #667eea;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="card">
    <h1>Ma Page Web</h1>
    <p>Créée avec PHP!</p>
  </div>
</body>
</html>';
?>
```

**Résultat**: Affiche une page web complète avec styles

---

### Exemple 5: PHP Dynamique avec Variables

```php
<?php
$nom = "Alice";
$age = 28;
$couleur = "#FF6B6B";

echo "<div style='background: $couleur; padding: 20px; color: white;'>";
echo "<h2>Profil de $nom</h2>";
echo "<p>Âge: $age ans</p>";
echo "<p>Date: " . date('d/m/Y H:i:s') . "</p>";
echo "</div>";
?>
```

**Résultat**: Affiche un profil avec données dynamiques

---

### Exemple 6: Boucles et Listes

```php
<?php
$fruits = ["Pomme", "Banane", "Orange", "Fraise"];

echo '<div style="background: #f0f0f0; padding: 20px;">';
echo '<h3>Liste de Fruits</h3>';
echo '<ul style="list-style-type: none; padding: 0;">';

foreach($fruits as $index => $fruit) {
  $couleur = ($index % 2 == 0) ? '#e3f2fd' : '#fff3e0';
  echo "<li style='background: $couleur; padding: 10px; margin: 5px; border-radius: 5px;'>$fruit</li>";
}

echo '</ul>';
echo '</div>';
?>
```

**Résultat**: Affiche une liste stylisée avec alternance de couleurs

---

### Exemple 7: Tableau HTML

```php
<?php
$etudiants = [
  ["nom" => "Jean", "note" => 15],
  ["nom" => "Marie", "note" => 18],
  ["nom" => "Pierre", "note" => 12]
];

echo '<table style="width: 100%; border-collapse: collapse;">';
echo '<tr style="background: #2196F3; color: white;">';
echo '<th style="padding: 10px; border: 1px solid #ddd;">Nom</th>';
echo '<th style="padding: 10px; border: 1px solid #ddd;">Note</th>';
echo '</tr>';

foreach($etudiants as $etudiant) {
  echo '<tr>';
  echo '<td style="padding: 10px; border: 1px solid #ddd;">' . $etudiant['nom'] . '</td>';
  echo '<td style="padding: 10px; border: 1px solid #ddd;">' . $etudiant['note'] . '/20</td>';
  echo '</tr>';
}

echo '</table>';
?>
```

**Résultat**: Affiche un tableau HTML stylisé

---

### Exemple 8: Formulaire HTML

```php
<?php
echo '<!DOCTYPE html>
<html>
<head>
  <style>
    .form-container {
      max-width: 400px;
      margin: 0 auto;
      padding: 20px;
      background: white;
      border-radius: 10px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
    }
    input, textarea {
      width: 100%;
      padding: 10px;
      margin: 10px 0;
      border: 1px solid #ddd;
      border-radius: 5px;
    }
    button {
      background: #4CAF50;
      color: white;
      padding: 10px 20px;
      border: none;
      border-radius: 5px;
      cursor: pointer;
    }
    button:hover {
      background: #45a049;
    }
  </style>
</head>
<body style="background: #f5f5f5; padding: 20px;">
  <div class="form-container">
    <h2>Formulaire de Contact</h2>
    <form>
      <input type="text" placeholder="Nom" required>
      <input type="email" placeholder="Email" required>
      <textarea placeholder="Message" rows="4" required></textarea>
      <button type="submit">Envoyer</button>
    </form>
  </div>
</body>
</html>';
?>
```

**Résultat**: Affiche un formulaire de contact stylisé

---

## 🎨 Fonctionnalités Avancées

### Basculer entre Rendu et Code Source

Lorsque votre code PHP génère du HTML:

1. **Mode Rendu** (par défaut): Affiche le HTML rendu visuellement
2. **Mode Source**: Affiche le code HTML brut

Cliquez sur le bouton **🎨 Voir le rendu** / **📄 Voir le code source** pour basculer

---

## 🔧 Fonctions PHP Disponibles

Toutes les fonctions PHP standard sont disponibles:

- ✅ `echo`, `print`
- ✅ `date()`, `time()`
- ✅ Variables et tableaux
- ✅ Boucles (`for`, `foreach`, `while`)
- ✅ Conditions (`if`, `else`, `switch`)
- ✅ Fonctions personnalisées
- ✅ Manipulation de chaînes
- ✅ Opérations mathématiques

---

## ⚠️ Limitations

- ❌ Pas d'accès aux bases de données (dans cette version)
- ❌ Pas d'accès au système de fichiers
- ❌ Pas de sessions PHP
- ❌ Pas de cookies
- ⏱️ Timeout d'exécution: 10 secondes

---

## 💡 Astuces

### 1. Utiliser des Guillemets Simples pour le HTML

```php
<?php
echo '<div class="container">Contenu</div>';
?>
```

### 2. Échapper les Guillemets Doubles

```php
<?php
echo "<div style=\"color: red;\">Texte</div>";
?>
```

### 3. Utiliser la Concaténation

```php
<?php
$nom = "Alice";
echo "<h1>Bonjour " . $nom . "!</h1>";
?>
```

### 4. Utiliser Heredoc pour du HTML Long

```php
<?php
$html = <<<HTML
<!DOCTYPE html>
<html>
<head>
  <title>Ma Page</title>
</head>
<body>
  <h1>Contenu</h1>
</body>
</html>
HTML;

echo $html;
?>
```

---

## 🐛 Dépannage

### Le code ne s'exécute pas

- Vérifiez que les balises `<?php ?>` sont présentes
- Vérifiez la syntaxe PHP (points-virgules, guillemets)

### Le HTML ne s'affiche pas

- Vérifiez que vous utilisez `echo` pour afficher le HTML
- Vérifiez que les balises HTML sont correctes

### Erreur "No code provided"

- Assurez-vous que l'éditeur contient du code avant d'exécuter

---

## Ressources

- [Documentation PHP](https://www.php.net/manual/fr/)
- [HTML Reference](https://developer.mozilla.org/fr/docs/Web/HTML)
- [CSS Reference](https://developer.mozilla.org/fr/docs/Web/CSS)

---

## 🎯 Exemples Prêts à l'Emploi

L'éditeur charge automatiquement un exemple complet au démarrage qui démontre:

- Structure HTML5 complète
- Styles CSS avec dégradés
- Intégration de données PHP dynamiques
- Bouton interactif avec JavaScript

Vous pouvez le modifier ou le remplacer par votre propre code!

---

**Bon codage! 🚀**
