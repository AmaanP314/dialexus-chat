#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Source NVM to make node and npm available to the script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting deployment process..."

# Pull the latest changes from the main branch
echo "1. Pulling latest code from GitHub..."
git pull origin main

# --- MODIFIED BLOCK: Use docker-compose to manage the backend stack ---
echo "2. Redeploying backend services with docker-compose..."
# Build the backend image and bring up both services (backend & redis).
# --no-deps prevents redis from restarting if it's already running.
# The 'backend' argument ensures only the backend service is rebuilt.
sudo docker-compose up -d --build --no-deps backend
# --- END OF MODIFICATION ---

echo "Waiting for containers to start..."
sleep 5 

echo "3. Seeding the PostgreSQL database..."
# This command is unchanged because we kept the container name the same
sudo docker exec chat-backend-container python scripts/seed.py

# --- NOTE: The 'cd' commands are no longer needed here ---

# Redeploy the frontend
echo "4. Redeploying frontend..."
cd frontend
npm install
npm run build
pm2 restart chat-frontend
cd ..

echo "Deployment finished successfully!"