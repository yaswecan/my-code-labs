# Fix Applied for Docker Exec Error

## Problem

The backend container was unable to execute `docker exec` commands due to Docker socket permission issues. The error occurred because:

1. The backend container user didn't have proper permissions to access `/var/run/docker.sock`
2. No health checks were in place to ensure php_sandbox was ready before backend tried to use it
3. Error messages weren't detailed enough to diagnose the issue

## Solution Applied

### 1. Updated `backend/Dockerfile`

**Fixed Docker socket permissions:**

- Added the `node` user to the `docker` group (GID 999)
- Changed the container to run as the `node` user instead of root
- This allows the backend to access the Docker socket without permission errors

```dockerfile
# Créer un groupe docker avec le GID qui correspond généralement au socket Docker de l'hôte
# et ajouter l'utilisateur node à ce groupe
RUN addgroup -g 999 docker || true && \
    addgroup node docker || true

# Lancer le serveur Express en tant qu'utilisateur node
USER node
```

### 2. Updated `docker-compose.yml`

**Added health checks and proper dependency management:**

- Added health check for `php-sandbox` container to verify it's ready
- Updated backend dependencies to wait for php-sandbox to be healthy
- Set explicit user/group IDs for the backend container (1000:999)

```yaml
php-sandbox:
  healthcheck:
    test: ["CMD", "php", "-v"]
    interval: 5s
    timeout: 3s
    retries: 3
    start_period: 5s

backend:
  depends_on:
    db:
      condition: service_started
    php-sandbox:
      condition: service_healthy
  user: "1000:999"
```

### 3. Improved `backend/server.js`

**Added Docker connectivity verification and better error handling:**

- Added `checkDockerConnectivity()` function to verify Docker access at startup
- Checks if php_sandbox container is running before executing code
- Increased timeout from 5000ms to 10000ms
- Added detailed error messages for common issues (permission denied, container not found)
- Uses async/await for better error handling

## How to Apply the Fix

1. **Stop and remove current containers:**

   ```bash
   docker-compose down
   ```

2. **Rebuild and start the containers:**

   ```bash
   docker-compose up --build
   ```

   Or run in detached mode:

   ```bash
   docker-compose up --build -d
   ```

3. **Verify the containers are running and healthy:**

   ```bash
   docker-compose ps
   ```

   You should see all containers with status "Up" and php_sandbox showing as "healthy"

4. **Check backend logs for Docker connectivity confirmation:**

   ```bash
   docker-compose logs backend
   ```

   You should see: `✅ Docker connectivity verified - php_sandbox container is running`

5. **Test the PHP execution:**
   - Open http://localhost:5173 in your browser
   - Try executing some PHP code in the editor (e.g., `<?php echo "Hello World!"; ?>`)
   - Check the backend logs for detailed execution information:
     ```bash
     docker-compose logs -f backend
     ```

## What Changed

### backend/Dockerfile

- Added docker group creation with GID 999
- Added node user to docker group
- Changed to run as non-root user (node)

### docker-compose.yml

- Added health check for php-sandbox container
- Changed depends_on to use condition-based dependencies
- Added explicit user:group mapping (1000:999) for backend
- Docker socket mount already present: `/var/run/docker.sock:/var/run/docker.sock`

### backend/server.js

- Added `checkDockerConnectivity()` function with promisified exec
- Verifies Docker connectivity at startup
- Checks container availability before each PHP execution
- Increased timeout to 10 seconds
- Added detailed error messages for common failure scenarios
- Better async error handling

## Troubleshooting

If you still encounter issues:

1. **Check if php_sandbox container is running and healthy:**

   ```bash
   docker-compose ps
   docker inspect php_sandbox --format='{{.State.Health.Status}}'
   ```

2. **Check backend logs for detailed error messages:**

   ```bash
   docker-compose logs backend
   ```

3. **Verify Docker socket permissions on host:**

   ```bash
   ls -la /var/run/docker.sock
   ```

   The socket should be accessible by group 999 (docker group)

4. **Test Docker exec manually from backend container:**

   ```bash
   docker-compose exec backend docker ps
   docker-compose exec backend docker exec php_sandbox php -v
   ```

5. **If permission issues persist, check Docker socket GID on your host:**

   ```bash
   stat -c '%g' /var/run/docker.sock
   ```

   If it's not 999, update the GID in backend/Dockerfile and docker-compose.yml accordingly

6. **Restart with clean slate:**

   ```bash
   docker-compose down -v
   docker-compose up --build
   ```

## Security Note

Mounting the Docker socket gives the backend container full access to the Docker daemon. This is acceptable for development environments but should be carefully considered for production use. Consider using Docker-in-Docker or other isolation methods for production deployments.

## Technical Details

**Why GID 999?**

- Most Linux distributions assign GID 999 to the docker group
- By matching this GID in the container, we ensure the node user can access the Docker socket
- The `|| true` in the Dockerfile prevents errors if the group already exists

**Why health checks?**

- Ensures php_sandbox is fully ready before backend tries to use it
- Prevents race conditions during container startup
- Provides better reliability and error messages
