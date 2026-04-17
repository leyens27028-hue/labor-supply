#!/bin/bash
# Deploy script for Labor Supply Management System
# Usage: bash scripts/deploy.sh

set -e

echo "Starting deployment..."

# Pull latest code
echo "Pulling latest code..."
git pull origin main

# Backend
echo "Installing backend dependencies..."
cd backend
npm ci --production
npx prisma generate
npx prisma migrate deploy
cd ..

# Frontend
echo "Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# Restart backend
echo "Restarting backend..."
cd backend
pm2 restart ecosystem.config.js --env production || pm2 start ecosystem.config.js --env production
cd ..

# Copy frontend to nginx
echo "Deploying frontend..."
sudo cp -r frontend/dist/* /var/www/labor-supply/

# Reload nginx
echo "Reloading nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "Deployment complete!"
