import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import sanitizeHtml from "sanitize-html";
import { pool, initDB } from "./db.js";
import {
  authenticateToken,
  createUser,
  authenticateUser,
  generateToken,
  updateExerciseProgress,
  updateLessonProgress,
  getUserProgress,
  getPartProgress,
  getThemeProgress,
} from "./auth.js";

const execPromise = promisify(exec);

// Charger les exercices
const exerciseData = JSON.parse(fs.readFileSync("./exercises.json", "utf8"));
const exercises = exerciseData.themes
  ? exerciseData.themes.flatMap((theme) =>
      theme.parts.flatMap(
        (part) => part.content?.filter((item) => item.type === "exercise") || []
      )
    )
  : [];

const app = express();
app.use(cors());
app.use(express.json());

// Dossier temporaire pour les fichiers PHP (doit être monté via Docker)
const TMP_DIR = "/app/sandbox";

// Crée le dossier sandbox si nécessaire (dans le conteneur backend)
if (!fs.existsSync(TMP_DIR)) {
  fs.mkdirSync(TMP_DIR, { recursive: true });
}

// Fonction pour vérifier la connectivité Docker
async function checkDockerConnectivity() {
  try {
    const { stdout } = await execPromise("docker ps --format '{{.Names}}'");
    const containers = stdout.trim().split("\n");

    if (containers.includes("php_sandbox")) {
      console.log(
        "✅ Docker connectivity verified - php_sandbox container is running"
      );
      return true;
    } else {
      console.warn("⚠️  php_sandbox container not found in running containers");
      console.log("Available containers:", containers);
      return false;
    }
  } catch (error) {
    console.error("❌ Docker connectivity check failed:", error.message);
    return false;
  }
}

// Initialiser la base de données
initDB().catch(console.error);

// Vérifier la connectivité Docker au démarrage
checkDockerConnectivity();

app.post("/api/run-php", async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.json({ error: "No code provided" });
  }

  // Nom unique pour le fichier temporaire
  const fileName = `code_${Date.now()}.php`;
  const filePath = path.join(TMP_DIR, fileName);

  try {
    // Vérifier que le conteneur php_sandbox est accessible
    const dockerReady = await checkDockerConnectivity();
    if (!dockerReady) {
      return res.json({
        error:
          "PHP sandbox container is not ready. Please ensure Docker containers are running properly.",
      });
    }

    // Écrire le code PHP dans le fichier temporaire
    fs.writeFileSync(filePath, code);
    console.log(`✅ PHP file created: ${filePath}`);

    // Exécuter le fichier PHP dans le conteneur php-sandbox
    // /sandbox correspond au volume monté dans le conteneur PHP
    const phpFilePathInContainer = `/sandbox/${fileName}`;
    const cmd = `docker exec php_sandbox php ${phpFilePathInContainer}`;

    console.log(`🚀 Executing: ${cmd}`);

    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      // Supprimer le fichier temporaire local
      try {
        fs.unlinkSync(filePath);
        console.log(`🗑️  Cleaned up: ${filePath}`);
      } catch (cleanupErr) {
        console.error(`⚠️  Failed to cleanup ${filePath}:`, cleanupErr.message);
      }

      if (err) {
        console.error(`❌ Execution error:`, err.message);
        console.error(`Command: ${cmd}`);
        console.error(`stderr:`, stderr);

        // Fournir un message d'erreur plus détaillé
        let errorMessage = stderr || err.message;
        if (err.message.includes("permission denied")) {
          errorMessage =
            "Docker permission denied. Please ensure the backend container has access to the Docker socket.";
        } else if (err.message.includes("No such container")) {
          errorMessage =
            "PHP sandbox container not found. Please ensure all containers are running.";
        }

        return res.json({ error: errorMessage });
      }

      console.log(`✅ Execution successful`);

      // Sanitize the output to prevent XSS
      const sanitizedOutput = sanitizeHtml(stdout, {
        allowedTags: [
          "html",
          "head",
          "body",
          "title",
          "meta",
          "link",
          "style",
          "script",
          "div",
          "span",
          "p",
          "h1",
          "h2",
          "h3",
          "h4",
          "h5",
          "h6",
          "ul",
          "ol",
          "li",
          "table",
          "thead",
          "tbody",
          "tr",
          "th",
          "td",
          "a",
          "img",
          "br",
          "strong",
          "em",
          "b",
          "i",
          "u",
          "s",
          "blockquote",
          "code",
          "pre",
          "hr",
          "button",
        ],
        allowedAttributes: {
          "*": ["class", "id", "style", "button"],
          a: ["href", "target"],
          img: ["src", "alt", "width", "height"],
          meta: ["charset", "name", "content"],
          link: ["rel", "href", "type"],
        },
        allowedSchemes: ["http", "https", "data"],
        allowVulnerableTags: false,
      });

      // Détecter si la sortie contient du HTML
      const isHtml = /<\s*([a-z][a-z0-9]*)\b[^>]*>/i.test(sanitizedOutput);

      res.json({
        output: sanitizedOutput,
        isHtml: isHtml,
      });
    });
  } catch (err) {
    // En cas d'erreur d'écriture ou autre
    console.error(`❌ Error:`, err.message);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error(`⚠️  Failed to cleanup ${filePath}:`, cleanupErr.message);
      }
    }
    res.json({ error: err.message });
  }
});

// Nouvel endpoint pour exécuter un projet multi-fichiers
app.post("/api/run-project", async (req, res) => {
  const { files, entryPoint } = req.body;

  console.log({ files });

  if (!files || !Array.isArray(files) || files.length === 0) {
    return res.json({ error: "No files provided" });
  }

  if (!entryPoint) {
    return res.json({ error: "No entry point specified" });
  }

  // Créer un dossier unique pour ce projet
  const projectId = `project_${Date.now()}`;
  const projectPath = path.join(TMP_DIR, projectId);

  try {
    // Vérifier que le conteneur php_sandbox est accessible
    const dockerReady = await checkDockerConnectivity();
    if (!dockerReady) {
      return res.json({
        error:
          "PHP sandbox container is not ready. Please ensure Docker containers are running properly.",
      });
    }

    // Créer le dossier du projet
    fs.mkdirSync(projectPath, { recursive: true });
    console.log(`✅ Project directory created: ${projectPath}`);

    // Écrire tous les fichiers
    for (const file of files) {
      const filePath = path.join(projectPath, file.name);
      fs.writeFileSync(filePath, file.content);
      console.log(`✅ File created: ${file.name}`);
    }

    // Exécuter le fichier d'entrée dans le conteneur
    const entryPointPath = `/sandbox/${projectId}/${entryPoint}`;
    const cmd = `docker exec php_sandbox php ${entryPointPath}`;

    console.log(`🚀 Executing project: ${cmd}`);

    exec(cmd, { timeout: 10000 }, (err, stdout, stderr) => {
      // Lire le contenu des fichiers avant de supprimer le dossier
      let fileContents = {};
      if (!err) {
        for (const file of files) {
          try {
            const filePath = path.join(projectPath, file.name);
            if (fs.existsSync(filePath)) {
              fileContents[file.name] = fs.readFileSync(filePath, "utf8");
            }
          } catch (readErr) {
            console.error(`⚠️  Failed to read ${file.name}:`, readErr.message);
          }
        }
      }

      // Supprimer le dossier du projet
      try {
        fs.rmSync(projectPath, { recursive: true, force: true });
        console.log(`🗑️  Cleaned up project: ${projectPath}`);
      } catch (cleanupErr) {
        console.error(
          `⚠️  Failed to cleanup ${projectPath}:`,
          cleanupErr.message
        );
      }

      if (err) {
        console.error(`❌ Execution error:`, err.message);
        console.error(`Command: ${cmd}`);
        console.error(`stderr:`, stderr);

        let errorMessage = stderr || err.message;
        if (err.message.includes("permission denied")) {
          errorMessage =
            "Docker permission denied. Please ensure the backend container has access to the Docker socket.";
        } else if (err.message.includes("No such container")) {
          errorMessage =
            "PHP sandbox container not found. Please ensure all containers are running.";
        }

        return res.json({ error: errorMessage });
      }

      console.log(`✅ Project execution successful`);

      try {
        // Sanitize the output to prevent XSS
        const sanitizedOutput = sanitizeHtml(stdout, {
          allowedTags: [
            "html",
            "head",
            "body",
            "title",
            "meta",
            "link",
            "style",
            "div",
            "span",
            "p",
            "h1",
            "h2",
            "h3",
            "h4",
            "h5",
            "h6",
            "ul",
            "ol",
            "li",
            "table",
            "thead",
            "tbody",
            "tr",
            "th",
            "td",
            "a",
            "img",
            "br",
            "strong",
            "script",
            "em",
            "b",
            "i",
            "u",
            "s",
            "blockquote",
            "code",
            "pre",
            "hr",
          ],
          allowedAttributes: {
            "*": ["class", "id"],
            a: ["href", "target"],
            img: ["src", "alt", "width", "height"],
            script: ["src"],
            meta: ["charset", "name", "content"],
            link: ["rel", "href", "type"],
          },
          allowedSchemes: ["http", "https", "data"],
          allowVulnerableTags: false,
        });

        // Détecter si la sortie contient du HTML
        const isHtml = /<\s*([a-z][a-z0-9]*)\b[^>]*>/i.test(sanitizedOutput);

        let finalOutput = sanitizedOutput;

        // Inliner les ressources CSS et JS si c'est du HTML
        if (isHtml) {
          // Inliner les CSS
          finalOutput = finalOutput.replace(
            /<link[^>]*rel="stylesheet"[^>]*href="([^"]*\.css)"[^>]*>/gi,
            (match, href) => {
              if (fileContents[href]) {
                return `<style>${fileContents[href]}</style>`;
              }
              return match;
            }
          );

          // Inliner les JS
          finalOutput = finalOutput.replace(
            /<script[^>]*src="([^"]*\.js)"[^>]*><\/script>/gi,
            (match, src) => {
              if (fileContents[src]) {
                return `<script>${fileContents[src]}</script>`;
              }
              return match;
            }
          );
        }

        res.json({
          output: finalOutput,
          isHtml: isHtml,
        });
      } catch (sanitizeErr) {
        console.error(`❌ Sanitization error:`, sanitizeErr.message);
        // Return raw output if sanitization fails
        const isHtml = /<\s*([a-z][a-z0-9]*)\b[^>]*>/i.test(stdout);
        res.json({
          output: stdout,
          isHtml: isHtml,
        });
      }
    });
  } catch (err) {
    console.error(`❌ Error:`, err.message);

    // Nettoyer en cas d'erreur
    if (fs.existsSync(projectPath)) {
      try {
        fs.rmSync(projectPath, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error(
          `⚠️  Failed to cleanup ${projectPath}:`,
          cleanupErr.message
        );
      }
    }

    res.json({ error: err.message });
  }
});

// Routes d'authentification
app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "Tous les champs sont requis" });
  }

  if (password.length < 6) {
    return res
      .status(400)
      .json({ error: "Le mot de passe doit contenir au moins 6 caractères" });
  }

  try {
    const user = await createUser(username, email, password);
    const token = generateToken(user);

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      user: { id: user.id, username: user.username, email: user.email },
      token,
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res
      .status(500)
      .json({ error: error.message || "Erreur lors de l'inscription" });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { usernameOrEmail, password } = req.body;

  if (!usernameOrEmail || !password) {
    return res
      .status(400)
      .json({ error: "Nom d'utilisateur/email et mot de passe requis" });
  }

  try {
    const user = await authenticateUser(usernameOrEmail, password);

    if (!user) {
      return res.status(401).json({ error: "Identifiants invalides" });
    }

    const token = generateToken(user);

    res.json({
      message: "Connexion réussie",
      user,
      token,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// Endpoint pour récupérer la liste des thèmes avec progression
app.get("/api/themes", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const themesWithProgress = await Promise.all(
      (exerciseData.themes || []).map(async (theme) => {
        const progress = await getThemeProgress(userId, theme);
        return {
          ...theme,
          progress,
        };
      })
    );

    res.json(themesWithProgress);
  } catch (error) {
    console.error("Erreur lors du chargement des thèmes:", error);
    res.status(500).json({ error: "Erreur lors du chargement des thèmes" });
  }
});

// Endpoint pour récupérer le contenu d'une partie spécifique
app.get(
  "/api/themes/:themeId/parts/:partId",
  authenticateToken,
  async (req, res) => {
    const { themeId, partId } = req.params;
    const userId = req.user.id;

    const theme = exerciseData.themes?.find((t) => t.id === themeId);
    if (!theme) {
      return res.status(404).json({ error: "Theme not found" });
    }

    const part = theme.parts?.find((p) => p.id === partId);
    if (!part) {
      return res.status(404).json({ error: "Part not found" });
    }

    // Calculer la progression de la partie pour cet utilisateur
    const progress = await getPartProgress(userId, part);

    // Récupérer la progression détaillée pour les éléments
    const userProgress = await getUserProgress(userId);

    res.json({
      ...part,
      progress,
      lessonProgress: userProgress.lessons,
      exerciseProgress: userProgress.exercises,
    });
  }
);

// Endpoint pour tester une leçon
app.post("/api/test-lesson", authenticateToken, async (req, res) => {
  const { lessonId, answer } = req.body;
  const userId = req.user.id;

  // Trouver la leçon dans toutes les parties
  let foundLesson = null;
  for (const theme of exerciseData.themes || []) {
    for (const part of theme.parts || []) {
      for (const item of part.content || []) {
        if (item.type === "lesson" && item.id === lessonId) {
          foundLesson = item;
          break;
        }
      }
      if (foundLesson) break;
    }
    if (foundLesson) break;
  }

  if (!foundLesson) {
    return res.status(404).json({ error: "Lesson not found" });
  }

  let testResult = { passed: false, message: "", correct: false };

  if (foundLesson.testType === "mcq") {
    // Test QCM
    const userAnswer = parseInt(answer);
    const correctAnswer = foundLesson.correctAnswer;

    testResult.passed = userAnswer === correctAnswer;
    testResult.correct = testResult.passed;
    testResult.message = testResult.passed
      ? "✅ Bonne réponse !"
      : `❌ Réponse incorrecte. La bonne réponse était : "${foundLesson.options[correctAnswer]}"`;
  } else if (foundLesson.testType === "text") {
    // Test texte (ancien système)
    const userAnswer = answer.toLowerCase().trim();
    const correctAnswer = foundLesson.answer.toLowerCase().trim();

    testResult.passed = userAnswer === correctAnswer;
    testResult.correct = testResult.passed;
    testResult.message = testResult.passed
      ? "✅ Bonne réponse !"
      : `❌ Réponse incorrecte. La bonne réponse était : "${foundLesson.answer}"`;
  }

  // Mettre à jour la progression de la leçon
  const score = testResult.passed ? 100 : 0;
  await updateLessonProgress(userId, lessonId, testResult.passed, score);

  res.json(testResult);
});

// Endpoint pour récupérer la liste des exercices
app.get("/api/exercises", (req, res) => {
  res.json(
    exercises.map((ex) => ({
      id: ex.id,
      title: ex.title,
      description: ex.description,
      difficulty: ex.difficulty,
      category: ex.category,
    }))
  );
});

// Endpoint pour récupérer un exercice spécifique
app.get("/api/exercises/:id", (req, res) => {
  const exercise = exercises.find((ex) => ex.id === req.params.id);
  if (!exercise) {
    return res.status(404).json({ error: "Exercise not found" });
  }
  res.json(exercise);
});

// Fonction pour exécuter du code PHP simple
async function runCode(code) {
  const fileName = `test_${Date.now()}.php`;
  const filePath = path.join(TMP_DIR, fileName);

  try {
    const dockerReady = await checkDockerConnectivity();
    if (!dockerReady) {
      throw new Error("PHP sandbox container is not ready.");
    }

    fs.writeFileSync(filePath, code);

    const phpFilePathInContainer = `/sandbox/${fileName}`;
    const cmd = `docker exec php_sandbox php ${phpFilePathInContainer}`;

    const { stdout, stderr } = await execPromise(cmd);

    // Cleanup
    try {
      fs.unlinkSync(filePath);
    } catch (cleanupErr) {
      console.error(`Failed to cleanup ${filePath}:`, cleanupErr.message);
    }

    if (stderr) {
      throw new Error(stderr);
    }

    return { output: stdout };
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (cleanupErr) {
        console.error(`Failed to cleanup ${filePath}:`, cleanupErr.message);
      }
    }
    throw error;
  }
}

// Fonction pour exécuter un projet multi-fichiers
async function runProject(files, entryPoint) {
  const projectId = `test_project_${Date.now()}`;
  const projectPath = path.join(TMP_DIR, projectId);

  try {
    const dockerReady = await checkDockerConnectivity();
    if (!dockerReady) {
      throw new Error("PHP sandbox container is not ready.");
    }

    fs.mkdirSync(projectPath, { recursive: true });

    // Write all files
    for (const file of files) {
      const filePath = path.join(projectPath, file.name);
      fs.writeFileSync(filePath, file.content);
    }

    const entryPointPath = `/sandbox/${projectId}/${entryPoint}`;
    const cmd = `docker exec php_sandbox php ${entryPointPath}`;

    const { stdout, stderr } = await execPromise(cmd);

    // Cleanup
    try {
      fs.rmSync(projectPath, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.error(`Failed to cleanup ${projectPath}:`, cleanupErr.message);
    }

    if (stderr) {
      throw new Error(stderr);
    }

    return { output: stdout };
  } catch (error) {
    // Cleanup on error
    if (fs.existsSync(projectPath)) {
      try {
        fs.rmSync(projectPath, { recursive: true, force: true });
      } catch (cleanupErr) {
        console.error(`Failed to cleanup ${projectPath}:`, cleanupErr.message);
      }
    }
    throw error;
  }
}

// Endpoint pour tester un exercice
app.post("/api/test-exercise", authenticateToken, async (req, res) => {
  const { exerciseId, code, files } = req.body;
  const userId = req.user.id;

  const exercise = exercises.find((ex) => ex.id === exerciseId);
  if (!exercise) {
    return res.status(404).json({ error: "Exercise not found" });
  }

  try {
    let testResult = { passed: false, message: "", details: {} };

    if (exercise.testType === "output") {
      // Test basé sur la sortie
      const result = await runCode(code);
      const output = result.output.trim();

      testResult.passed = output === exercise.expectedOutput;
      testResult.message = testResult.passed
        ? "✅ Test réussi !"
        : `❌ Test échoué. Attendu: "${exercise.expectedOutput}", Reçu: "${output}"`;
      testResult.details = {
        expected: exercise.expectedOutput,
        actual: output,
      };
    } else if (exercise.testType === "interactive") {
      // Test pour projets multi-fichiers interactifs
      const result = await runProject(
        files || [{ name: "index.php", content: code }],
        "index.php"
      );

      // Vérifications basiques pour les tests interactifs
      const hasButton =
        result.output.includes("<button") &&
        result.output.includes("</button>");
      const hasScript =
        result.output.includes("<script") &&
        result.output.includes("</script>");
      const hasStyle =
        result.output.includes("<style") ||
        result.output.includes('href="style.css"');

      testResult.passed = hasButton && hasScript && hasStyle;
      testResult.message = testResult.passed
        ? "✅ Structure de la page validée !"
        : "❌ La page ne contient pas tous les éléments requis (bouton, script, style)";
      testResult.details = {
        hasButton,
        hasScript,
        hasStyle,
        output: result.output.substring(0, 500) + "...",
      };
    }

    // Mettre à jour la progression de l'exercice
    const score = testResult.passed ? 100 : 0;
    await updateExerciseProgress(userId, exerciseId, testResult.passed, score);

    res.json(testResult);
  } catch (error) {
    res.status(500).json({
      passed: false,
      message: "❌ Erreur lors du test: " + error.message,
      details: { error: error.message },
    });
  }
});

// Endpoint pour récupérer les informations de base de données de l'élève
app.get("/api/user/database-info", authenticateToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [rows] = await pool.execute(
      "SELECT db_name, db_user, db_password, db_host, db_port FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0 || !rows[0].db_name) {
      return res.status(404).json({ error: "Base de données non configurée" });
    }

    const dbInfo = rows[0];
    res.json({
      dbName: dbInfo.db_name,
      dbUser: dbInfo.db_user,
      dbPassword: dbInfo.db_password,
      dbHost: dbInfo.db_host,
      dbPort: dbInfo.db_port,
      phpmyadminUrl: `http://localhost:8080`,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des infos DB:", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

app.listen(4000, () => {
  console.log("🚀 Backend running on http://localhost:4000");
  console.log(`📚 ${exercises.length} exercises loaded`);
  console.log("🗄️  phpMyAdmin disponible sur http://localhost:8080");
});
