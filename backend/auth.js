import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "./db.js";

const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";

// Fonction pour hasher un mot de passe
export async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Fonction pour vérifier un mot de passe
export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

// Fonction pour générer un token JWT
export function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

// Fonction pour vérifier un token JWT
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Middleware pour vérifier l'authentification
export function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: "Token invalide" });
  }

  req.user = decoded;
  next();
}

// Fonction pour créer un utilisateur
export async function createUser(username, email, password) {
  const hashedPassword = await hashPassword(password);

  try {
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
      [username, email, hashedPassword]
    );

    return { id: result.insertId, username, email };
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      throw new Error("Nom d'utilisateur ou email déjà utilisé");
    }
    throw error;
  }
}

// Fonction pour authentifier un utilisateur
export async function authenticateUser(usernameOrEmail, password) {
  const [rows] = await pool.execute(
    "SELECT id, username, email, password_hash FROM users WHERE username = ? OR email = ?",
    [usernameOrEmail, usernameOrEmail]
  );

  if (rows.length === 0) {
    return null;
  }

  const user = rows[0];
  const isValidPassword = await verifyPassword(password, user.password_hash);

  if (!isValidPassword) {
    return null;
  }

  return { id: user.id, username: user.username, email: user.email };
}

// Fonction pour mettre à jour la progression d'un exercice
export async function updateExerciseProgress(
  userId,
  exerciseId,
  completed,
  score = 0
) {
  try {
    await pool.execute(
      `INSERT INTO progress (user_id, exercise_id, completed, score, attempts, last_attempt)
       VALUES (?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
       completed = VALUES(completed),
       score = GREATEST(score, VALUES(score)),
       attempts = attempts + 1,
       last_attempt = NOW(),
       updated_at = NOW()`,
      [userId, exerciseId, completed, score]
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la progression:", error);
    throw error;
  }
}

// Fonction pour mettre à jour la progression d'une leçon
export async function updateLessonProgress(
  userId,
  lessonId,
  completed,
  score = 0
) {
  try {
    await pool.execute(
      `INSERT INTO lesson_progress (user_id, lesson_id, completed, score, attempts, last_attempt)
       VALUES (?, ?, ?, ?, 1, NOW())
       ON DUPLICATE KEY UPDATE
       completed = VALUES(completed),
       score = GREATEST(score, VALUES(score)),
       attempts = attempts + 1,
       last_attempt = NOW(),
       updated_at = NOW()`,
      [userId, lessonId, completed, score]
    );
  } catch (error) {
    console.error(
      "Erreur lors de la mise à jour de la progression de la leçon:",
      error
    );
    throw error;
  }
}

// Fonction pour récupérer la progression d'un utilisateur
export async function getUserProgress(userId) {
  try {
    const [exerciseProgress] = await pool.execute(
      "SELECT exercise_id, completed, score, attempts FROM progress WHERE user_id = ?",
      [userId]
    );

    const [lessonProgress] = await pool.execute(
      "SELECT lesson_id, completed, score, attempts FROM lesson_progress WHERE user_id = ?",
      [userId]
    );

    return {
      exercises: exerciseProgress,
      lessons: lessonProgress,
    };
  } catch (error) {
    console.error("Erreur lors de la récupération de la progression:", error);
    throw error;
  }
}

// Fonction pour calculer la progression d'une partie
export async function getPartProgress(userId, part) {
  try {
    const totalExercises = part.content.filter(
      (item) => item.type === "exercise"
    ).length;
    const totalLessons = part.content.filter(
      (item) => item.type === "lesson"
    ).length;

    if (totalExercises === 0 && totalLessons === 0) return 0;

    const exerciseIds = part.content
      .filter((item) => item.type === "exercise")
      .map((item) => item.id);
    const lessonIds = part.content
      .filter((item) => item.type === "lesson")
      .map((item) => item.id);

    let completedExercises = 0;
    let completedLessons = 0;

    if (exerciseIds.length > 0) {
      const [exerciseResults] = await pool.execute(
        `SELECT COUNT(*) as count FROM progress
         WHERE user_id = ? AND exercise_id IN (${exerciseIds
           .map(() => "?")
           .join(",")}) AND completed = TRUE`,
        [userId, ...exerciseIds]
      );
      completedExercises = exerciseResults[0].count;
    }

    if (lessonIds.length > 0) {
      const [lessonResults] = await pool.execute(
        `SELECT COUNT(*) as count FROM lesson_progress
         WHERE user_id = ? AND lesson_id IN (${lessonIds
           .map(() => "?")
           .join(",")}) AND completed = TRUE`,
        [userId, ...lessonIds]
      );
      completedLessons = lessonResults[0].count;
    }

    const totalCompleted = completedExercises + completedLessons;
    const totalItems = totalExercises + totalLessons;

    return totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;
  } catch (error) {
    console.error(
      "Erreur lors du calcul de la progression de la partie:",
      error
    );
    return 0;
  }
}
