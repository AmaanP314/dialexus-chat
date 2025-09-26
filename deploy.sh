#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Source NVM to make node and npm available to the script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting deployment process..."

# Pull the latest changes from the main branch
echo "1. Pulling latest code from GitHub..."
git pull origin main

# Redeploy the backend
echo "2. Redeploying backend..."
cd backend
sudo docker build -t chat-backend .
sudo docker stop chat-backend-container || true
sudo docker rm chat-backend-container || true
sudo docker run -d --restart always -p 7860:7860 --env-file ./.env --add-host=host.docker.internal:host-gateway --name chat-backend-container chat-backend
cd ..

# Redeploy the frontend
echo "3. Redeploying frontend..."
cd frontend
npm install
npm run build
pm2 restart chat-frontend
cd ..

echo "Deployment finished successfully!"
