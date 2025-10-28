import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";
import sanitizeHtml from "sanitize-html";

const execPromise = promisify(exec);

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

app.listen(4000, () => {
  console.log("🚀 Backend running on http://localhost:4000");
});
