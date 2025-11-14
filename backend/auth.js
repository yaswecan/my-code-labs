import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool, createStudentDatabase } from "./db.js";

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
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role || "student",
    },
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

// Middleware pour vérifier que l'utilisateur est un enseignant
export function requireTeacher(req, res, next) {
  if (req.user.role !== "teacher") {
    return res.status(403).json({ error: "Accès réservé aux enseignants" });
  }
  next();
}

// Fonction pour créer un utilisateur
export async function createUser(username, email, password, role = "student") {
  const hashedPassword = await hashPassword(password);

  try {
    // Créer l'utilisateur d'abord
    const [result] = await pool.execute(
      "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, role]
    );

    const userId = result.insertId;

    // Créer la base de données dédiée pour l'élève
    try {
      const dbCredentials = await createStudentDatabase(userId, username);

      // Mettre à jour l'utilisateur avec les credentials de sa DB
      await pool.execute(
        "UPDATE users SET db_name = ?, db_user = ?, db_password = ?, db_host = ?, db_port = ? WHERE id = ?",
        [
          dbCredentials.dbName,
          dbCredentials.dbUser,
          dbCredentials.dbPassword,
          dbCredentials.dbHost,
          dbCredentials.dbPort,
          userId,
        ]
      );

      console.log(`✅ Utilisateur ${username} créé avec sa base de données`);
    } catch (dbError) {
      console.error(
        `⚠️ Erreur lors de la création de la DB pour ${username}:`,
        dbError
      );
      // On continue même si la création de la DB échoue
    }

    return { id: userId, username, email, role };
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
    "SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?",
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

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
  };
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

    // Vérifier et attribuer le badge de thème si nécessaire
    if (completed) {
      const themeId = await getThemeIdFromExercise(exerciseId);
      if (themeId) {
        await checkAndAwardThemeBadges(userId, themeId);
      }
    }
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

    // Vérifier et attribuer le badge de thème si nécessaire
    if (completed) {
      const themeId = await getThemeIdFromLesson(lessonId);
      if (themeId) {
        await checkAndAwardThemeBadges(userId, themeId);
      }
    }
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

// Fonction pour vérifier et attribuer les badges de thème
export async function checkAndAwardThemeBadges(userId, themeId) {
  try {
    // Vérifier si l'utilisateur a déjà ce badge
    const [existingBadge] = await pool.execute(
      `SELECT ub.id FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ? AND b.badge_key = ?`,
      [userId, `theme_${themeId}`]
    );

    if (existingBadge.length > 0) {
      return false; // Badge déjà obtenu
    }

    // Calculer la progression du thème
    const fs = await import("fs");
    const exerciseData = JSON.parse(
      fs.readFileSync("./exercises.json", "utf8")
    );
    const theme = exerciseData.themes?.find((t) => t.id === themeId);

    if (!theme) {
      return false;
    }

    const progress = await getThemeProgress(userId, theme);

    // Si progression = 100%, attribuer le badge
    if (progress === 100) {
      // Récupérer l'ID du badge
      const [badgeResult] = await pool.execute(
        "SELECT id FROM badges WHERE badge_key = ?",
        [`theme_${themeId}`]
      );

      if (badgeResult.length > 0) {
        const badgeId = badgeResult[0].id;

        // Attribuer le badge
        await pool.execute(
          "INSERT INTO user_badges (user_id, badge_id) VALUES (?, ?)",
          [userId, badgeId]
        );

        console.log(
          `🏆 Badge "${theme.title}" attribué à l'utilisateur ${userId}`
        );
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error("Erreur lors de l'attribution du badge:", error);
    return false;
  }
}

// Fonction pour récupérer les badges d'un utilisateur
export async function getUserBadges(userId) {
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.badge_key, b.name, b.description, b.icon, b.theme_id, ub.earned_at
       FROM user_badges ub
       JOIN badges b ON ub.badge_id = b.id
       WHERE ub.user_id = ?
       ORDER BY ub.earned_at DESC`,
      [userId]
    );

    return rows;
  } catch (error) {
    console.error("Erreur lors de la récupération des badges:", error);
    throw error;
  }
}

// Fonction pour obtenir l'ID du thème à partir d'un exerciseId
export async function getThemeIdFromExercise(exerciseId) {
  const fs = await import("fs");
  const exerciseData = JSON.parse(fs.readFileSync("./exercises.json", "utf8"));

  for (const theme of exerciseData.themes || []) {
    for (const part of theme.parts || []) {
      for (const item of part.content || []) {
        if (item.type === "exercise" && item.id === exerciseId) {
          return theme.id;
        }
      }
    }
  }
  return null;
}

// Fonction pour obtenir l'ID du thème à partir d'un lessonId
export async function getThemeIdFromLesson(lessonId) {
  const fs = await import("fs");
  const exerciseData = JSON.parse(fs.readFileSync("./exercises.json", "utf8"));

  for (const theme of exerciseData.themes || []) {
    for (const part of theme.parts || []) {
      for (const item of part.content || []) {
        if (item.type === "lesson" && item.id === lessonId) {
          return theme.id;
        }
      }
    }
  }
  return null;
}

// Fonction pour calculer la progression d'un thème
export async function getThemeProgress(userId, theme) {
  try {
    let totalItems = 0;
    let totalCompleted = 0;

    for (const part of theme.parts) {
      const exerciseIds = part.content
        .filter((item) => item.type === "exercise")
        .map((item) => item.id);
      const lessonIds = part.content
        .filter((item) => item.type === "lesson")
        .map((item) => item.id);

      totalItems += exerciseIds.length + lessonIds.length;

      if (exerciseIds.length > 0) {
        const [exerciseResults] = await pool.execute(
          `SELECT COUNT(*) as count FROM progress
           WHERE user_id = ? AND exercise_id IN (${exerciseIds
             .map(() => "?")
             .join(",")}) AND completed = TRUE`,
          [userId, ...exerciseIds]
        );
        totalCompleted += exerciseResults[0].count;
      }

      if (lessonIds.length > 0) {
        const [lessonResults] = await pool.execute(
          `SELECT COUNT(*) as count FROM lesson_progress
           WHERE user_id = ? AND lesson_id IN (${lessonIds
             .map(() => "?")
             .join(",")}) AND completed = TRUE`,
          [userId, ...lessonIds]
        );
        totalCompleted += lessonResults[0].count;
      }
    }

    const progress =
      totalItems > 0 ? Math.round((totalCompleted / totalItems) * 100) : 0;

    return progress;
  } catch (error) {
    console.error("Erreur lors du calcul de la progression du thème:", error);
    return 0;
  }
}
