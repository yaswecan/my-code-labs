import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || "host.docker.internal",
  user: process.env.DB_USER || "user",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "monapp",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Pool admin pour créer/gérer les bases de données des élèves
const adminPool = mysql.createPool({
  host: process.env.DB_HOST || "host.docker.internal",
  user: "root",
  password: process.env.DB_ROOT_PASSWORD || "rootpassword",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Initialiser la base de données
async function initDB() {
  try {
    const connection = await pool.getConnection();

    // Créer la table users avec colonnes pour DB élève et rôle
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('student', 'teacher') DEFAULT 'student',
        db_name VARCHAR(100),
        db_user VARCHAR(100),
        db_password VARCHAR(255),
        db_host VARCHAR(100) DEFAULT 'db',
        db_port INT DEFAULT 3306,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Créer la table progress
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        exercise_id VARCHAR(50) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        score INT DEFAULT 0,
        attempts INT DEFAULT 0,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_exercise (user_id, exercise_id)
      )
    `);

    // Créer la table lesson_progress
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS lesson_progress (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        lesson_id VARCHAR(50) NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        score INT DEFAULT 0,
        attempts INT DEFAULT 0,
        last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_lesson (user_id, lesson_id)
      )
    `);

    // Créer la table badges
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        badge_key VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        icon VARCHAR(50) DEFAULT '🏆',
        theme_id VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Créer la table user_badges
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS user_badges (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        badge_id INT NOT NULL,
        earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_badge (user_id, badge_id)
      )
    `);

    // Insérer les badges par défaut pour chaque thème
    const exerciseData = JSON.parse(
      await fs.readFileSync("./exercises.json", "utf8")
    );
    if (exerciseData.themes) {
      for (const theme of exerciseData.themes) {
        await connection.execute(
          `
          INSERT IGNORE INTO badges (badge_key, name, description, icon, theme_id)
          VALUES (?, ?, ?, ?, ?)
        `,
          [
            `theme_${theme.id}`,
            `Maître ${theme.title}`,
            `A complété entièrement le thème "${theme.title}"`,
            "🏆",
            theme.id,
          ]
        );
      }
    }

    connection.release();
    console.log("✅ Base de données initialisée avec succès");
  } catch (error) {
    console.error(
      "❌ Erreur lors de l'initialisation de la base de données:",
      error
    );
    throw error;
  }
}

// Fonction pour créer une base de données et un utilisateur pour un élève
async function createStudentDatabase(userId, username) {
  const dbName = `student_${userId}_db`;
  const dbUser = `student_${userId}`;
  const dbPassword = generateSecurePassword();

  try {
    // Créer la base de données
    await adminPool.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);

    // Créer l'utilisateur et lui donner tous les privilèges sur sa base
    await adminPool.execute(
      `CREATE USER IF NOT EXISTS '${dbUser}'@'%' IDENTIFIED BY '${dbPassword}'`
    );
    await adminPool.execute(
      `GRANT ALL PRIVILEGES ON \`${dbName}\`.* TO '${dbUser}'@'%'`
    );
    await adminPool.execute(`FLUSH PRIVILEGES`);

    console.log(`✅ Base de données créée pour l'élève ${username}: ${dbName}`);

    return {
      dbName,
      dbUser,
      dbPassword,
      dbHost: "db",
      dbPort: 3306,
    };
  } catch (error) {
    console.error(
      `❌ Erreur lors de la création de la base de données pour ${username}:`,
      error
    );
    throw error;
  }
}

// Fonction pour générer un mot de passe sécurisé
function generateSecurePassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let password = "";
  for (let i = 0; i < 16; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export { pool, initDB, adminPool, createStudentDatabase };
