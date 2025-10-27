# Quick Fix Guide - Docker Exec Error

## What was the problem?

The error `"Command failed: docker exec php_sandbox php /sandbox/code_1761578347113.php"` occurred because the backend container didn't have proper permissions to access the Docker socket.

## What was fixed?

✅ **backend/Dockerfile** - Added Docker permissions for the node user
✅ **docker-compose.yml** - Added health checks and proper dependencies
✅ **backend/server.js** - Added Docker connectivity verification and better error handling
✅ **FIX_INSTRUCTIONS.md** - Updated with comprehensive documentation

## How to apply the fix NOW:

### Step 1: Stop current containers

```bash
docker-compose down
```

### Step 2: Rebuild and start

```bash
docker-compose up --build
```

### Step 3: Verify it's working

```bash
# Check all containers are running
docker-compose ps

# Check backend logs
docker-compose logs backend
```

You should see: `✅ Docker connectivity verified - php_sandbox container is running`

### Step 4: Test in browser

1. Open http://localhost:5173
2. Try this PHP code:

```php
<?php
echo "Hello from PHP!";
phpinfo();
?>
```

## If you still get errors:

### Check Docker socket permissions on your Mac:

```bash
ls -la /var/run/docker.sock
stat -f '%g' /var/run/docker.sock
```

### If the GID is not 999, update these files:

**backend/Dockerfile** - Change line 7:

```dockerfile
RUN addgroup -g YOUR_GID docker || true && \
```

**docker-compose.yml** - Change line 38:

```yaml
user: "1000:YOUR_GID"
```

Replace `YOUR_GID` with the actual GID from the stat command.

### Clean restart:

```bash
docker-compose down -v
docker-compose up --build
```

## Need more help?

See `FIX_INSTRUCTIONS.md` for detailed troubleshooting steps.
