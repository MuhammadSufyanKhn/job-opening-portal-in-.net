# Multi-Stage Dockerfile for HireSphere Frontend (React + Vite)
# =============================================================================
# Build Stage
FROM node:22-alpine AS build
WORKDIR /app

# Install dependencies with npm ci for deterministic installs
COPY package*.json ./
RUN npm ci

# Copy frontend source code
COPY . .

# Build production bundle
RUN npm run build

# =============================================================================
# Production Serving Stage (Nginx Alpine)
FROM nginx:1.27-alpine AS runtime

# Remove default nginx site
RUN rm -rf /usr/share/nginx/html/*

# Copy built artifacts from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration with SPA fallback and API proxying
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
