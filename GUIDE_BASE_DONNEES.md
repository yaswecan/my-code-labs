# Guide d'Utilisation des Bases de Données MySQL pour les Élèves

## 🎯 Vue d'ensemble

Chaque élève dispose de sa propre base de données MySQL isolée et sécurisée pour pratiquer SQL et développer des applications PHP avec base de données.

## 🔑 Fonctionnalités

### 1. Base de Données Personnelle

- **Création automatique** : Une base de données dédiée est créée lors de l'inscription
- **Isolation complète** : Chaque élève ne peut accéder qu'à sa propre base
- **Nom de la base** : `student_X_db` (où X est l'ID de l'élève)
- **Utilisateur dédié** : `student_X` avec mot de passe sécurisé généré automatiquement

### 2. Accès aux Informations de Connexion

Dans l'interface, cliquez sur **"🗄️ Ma Base de Données"** pour voir :

- Nom de la base de données
- Nom d'utilisateur
- Mot de passe (avec option afficher/masquer)
- Hôte et port
- Exemple de code PHP de connexion

### 3. Interface phpMyAdmin

- **URL** : http://localhost:8080
- **Accès** : Utilisez vos identifiants personnels affichés dans l'interface
- **Fonctionnalités** :
  - Créer et gérer des tables
  - Exécuter des requêtes SQL
  - Importer/Exporter des données
  - Visualiser la structure de la base

## 💻 Utilisation dans les Exercices PHP

### Exemple de Connexion PDO

```php
<?php
$host = "db";
$dbname = "student_1_db";  // Votre base de données
$username = "student_1";    // Votre utilisateur
$password = "VotreMotDePasse"; // Votre mot de passe

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
?>
```

### Exemple de Création de Table

```php
<?php
// Connexion à la base (voir exemple ci-dessus)

$sql = "CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)";

$pdo->exec($sql);
echo "✅ Table créée avec succès !";
?>
```

### Exemple d'Insertion de Données

```php
<?php
// Connexion à la base

$sql = "INSERT INTO users (nom, email) VALUES (:nom, :email)";
$stmt = $pdo->prepare($sql);
$stmt->execute([
    'nom' => 'Jean Dupont',
    'email' => 'jean@example.com'
]);

echo "✅ Utilisateur ajouté !";
?>
```

### Exemple de Lecture de Données

```php
<?php
// Connexion à la base

$sql = "SELECT * FROM users";
$stmt = $pdo->query($sql);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);

foreach ($users as $user) {
    echo "ID: " . $user['id'] . " - ";
    echo "Nom: " . $user['nom'] . " - ";
    echo "Email: " . $user['email'] . "<br>";
}
?>
```

## 🛡️ Sécurité

### Bonnes Pratiques

1. **Ne partagez jamais vos identifiants** de base de données
2. **Utilisez toujours des requêtes préparées** (prepared statements) pour éviter les injections SQL
3. **Validez les données** avant de les insérer dans la base
4. **Gérez les erreurs** de manière appropriée

### Exemple de Requête Sécurisée

```php
<?php
// ❌ MAUVAIS - Vulnérable aux injections SQL
$email = $_POST['email'];
$sql = "SELECT * FROM users WHERE email = '$email'";

// ✅ BON - Utilisation de requêtes préparées
$email = $_POST['email'];
$sql = "SELECT * FROM users WHERE email = :email";
$stmt = $pdo->prepare($sql);
$stmt->execute(['email' => $email]);
?>
```

## Gestion avec phpMyAdmin

### Se Connecter

1. Ouvrez http://localhost:8080
2. Sélectionnez "MySQL" comme type de serveur
3. Entrez vos identifiants personnels
4. Cliquez sur "Connexion"

### Créer une Table

1. Sélectionnez votre base de données dans le menu de gauche
2. Cliquez sur l'onglet "SQL"
3. Entrez votre requête CREATE TABLE
4. Cliquez sur "Exécuter"

### Visualiser les Données

1. Sélectionnez votre table dans le menu de gauche
2. Cliquez sur "Afficher" pour voir les données
3. Utilisez les filtres pour rechercher des données spécifiques

### Exporter des Données

1. Sélectionnez votre base de données
2. Cliquez sur l'onglet "Exporter"
3. Choisissez le format (SQL, CSV, etc.)
4. Cliquez sur "Exécuter"

## 🎓 Exercices Pratiques

### Exercice 1 : Créer une Table de Contacts

```sql
CREATE TABLE contacts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    telephone VARCHAR(20),
    email VARCHAR(100) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Exercice 2 : Insérer des Données

```sql
INSERT INTO contacts (nom, prenom, telephone, email) VALUES
('Dupont', 'Jean', '0123456789', 'jean.dupont@example.com'),
('Martin', 'Marie', '0987654321', 'marie.martin@example.com');
```

### Exercice 3 : Requêtes de Sélection

```sql
-- Tous les contacts
SELECT * FROM contacts;

-- Contacts triés par nom
SELECT * FROM contacts ORDER BY nom ASC;

-- Recherche par nom
SELECT * FROM contacts WHERE nom LIKE 'D%';
```

## 🔧 Dépannage

### Problème : Impossible de se connecter

- Vérifiez que vous utilisez les bons identifiants
- Assurez-vous que le conteneur MySQL est en cours d'exécution
- Vérifiez que le port 3306 n'est pas bloqué

### Problème : Erreur "Access denied"

- Vérifiez que vous utilisez le bon nom d'utilisateur et mot de passe
- Assurez-vous d'utiliser votre base de données personnelle

### Problème : phpMyAdmin ne se charge pas

- Vérifiez que le conteneur phpMyAdmin est en cours d'exécution
- Essayez de rafraîchir la page
- Vérifiez que le port 8080 est disponible

## Ressources Supplémentaires

- [Documentation MySQL](https://dev.mysql.com/doc/)
- [Documentation PDO PHP](https://www.php.net/manual/fr/book.pdo.php)
- [Guide phpMyAdmin](https://docs.phpmyadmin.net/)
- [Tutoriel SQL](https://www.w3schools.com/sql/)

## ⚠️ Limitations

- **Capacité de stockage** : Limitée par la configuration du serveur
- **Nombre de connexions simultanées** : 50 élèves maximum
- **Sauvegarde** : Les données sont persistantes mais pensez à exporter régulièrement
- **Accès** : Uniquement depuis l'environnement de développement local

## 💡 Conseils

1. **Testez vos requêtes** dans phpMyAdmin avant de les utiliser dans votre code PHP
2. **Documentez votre schéma** de base de données
3. **Utilisez des noms de tables et colonnes explicites**
4. **Créez des index** pour améliorer les performances
5. **Sauvegardez régulièrement** vos données importantes

---

**Support** : En cas de problème, contactez votre enseignant ou consultez la documentation.
