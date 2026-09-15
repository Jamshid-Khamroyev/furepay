# Stage 1: Build frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
ARG VITE_API_URL=http://169.58.221.22
ARG VITE_GOOGLE_CLIENT_ID=490167420024-1n6tdeh8c7lmcfm381crftnv9vmfchhu.apps.googleusercontent.com
RUN VITE_API_URL=$VITE_API_URL VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID npm run build

# Stage 2: Production backend
FROM node:20-alpine AS production
WORKDIR /app
COPY backend/package*.json ./
RUN npm ci
COPY backend/ ./
# Copy built frontend into backend's public folder (served as static files)
COPY --from=frontend-builder /app/frontend/dist ./public
# Generate Prisma client
RUN npx prisma generate
EXPOSE 3001
CMD ["npx", "tsx", "server.ts"]
