import express from "express";
import cors from "cors";
import { exec } from "child_process";
import fs from "fs";
import path from "path";
import { promisify } from "util";

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
      res.json({ output: stdout });
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

app.listen(4000, () => {
  console.log("🚀 Backend running on http://localhost:4000");
});
