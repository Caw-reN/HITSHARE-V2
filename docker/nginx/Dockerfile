# ==============================================================================
# HitShare Web Server (Nginx + Frontend Build)
# ==============================================================================
# Stage 1: Build React Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci --prefer-offline || npm install

COPY frontend/ ./
RUN npm run build

# Stage 2: Serve via Nginx Alpine
FROM nginx:alpine

# Copy frontend static build files
COPY --from=frontend-builder /app/dist /var/www/frontend

# Copy backend static public files (for downloads and uploads structure)
COPY backend/public /var/www/backend/public

# Copy Nginx server configuration
COPY docker/nginx/hitshare.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

STOPSIGNAL SIGQUIT

CMD ["nginx", "-g", "daemon off;"]
