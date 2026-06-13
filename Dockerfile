# ==========================================
# AeroAI Smart Boarding - Multi-stage Dockerfile
# ==========================================

# --- Stage 1: Build & Bundling ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency files to use Docker build cache effectively
COPY package*.json ./

# Install both production and developmental dependencies for compilation/checks
RUN npm ci

# Copy raw source code and asset definitions
COPY . .

# Compile Vite frontend assets and bundle Express wrapper into CJS distribution
RUN npm run build

# --- Stage 2: Runtime Environment ---
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package configurations
COPY package*.json ./

# Install only production dependencies for light-weight runtime footprint
RUN npm ci --only=production

# Copy compiled bundles, public statics, and configuration assets from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/firestore.rules ./
COPY --from=builder /app/firebase-blueprint.json ./

# Expose internal AeroAI gateway port
EXPOSE 3000

# Execute server bundle
CMD ["npm", "start"]
