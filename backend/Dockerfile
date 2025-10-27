# Utiliser Node.js Alpine pour un conteneur léger
FROM node:20-alpine

# Installer Docker CLI (nécessaire pour docker exec)
RUN apk add --no-cache docker-cli

# Définir le répertoire de travail
WORKDIR /app

# Copier package.json et package-lock.json
COPY package*.json ./

# Installer les dépendances
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port du backend
EXPOSE 4000

# Lancer le serveur Express en tant qu'utilisateur node
USER node
CMD ["npm", "run", "dev"]
