#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.

# Source NVM to make node and npm available to the script
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/n_vm.sh" ] && \. "$NVM_DIR/nvm.sh"

echo "Starting deployment process..."

# Pull the latest changes from the main branch
echo "1. Pulling latest code from GitHub..."
git pull origin main

# --- MODIFIED BLOCK: Use the correct docker-compose command ---
echo "2. Redeploying backend services with docker-compose..."
# This single command does everything:
# - It builds any images that have changed (your backend).
# - It starts ALL services defined in the docker-compose.yml file.
# - It re-creates containers if their configuration has changed.
sudo docker-compose up -d --build
# --- END OF MODIFICATION ---

echo "Waiting for containers to start..."
sleep 5 

echo "3. Seeding the PostgreSQL database..."
sudo docker exec chat-backend-container python scripts/seed.py

# Redeploy the frontend
echo "4. Redeploying frontend..."
cd frontend
npm install
npm run build
pm2 restart chat-frontend
cd ..

echo "Deployment finished successfully!"