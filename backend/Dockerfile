# ==========================================
# Stage 1: Dependencies
# ==========================================
FROM node:22-alpine AS deps
WORKDIR /app

# Install OpenSSL and libc6-compat required for Prisma ORM on Alpine
RUN apk add --no-cache openssl libc6-compat

# Copy package files and Prisma schema first for Docker layer caching
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# ==========================================
# Stage 2: Builder
# ==========================================
FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache openssl libc6-compat

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Generate Prisma Client for Alpine target
RUN npx prisma generate

# Compile TypeScript to JavaScript (outputs to dist/)
RUN npm run build

# Prune devDependencies to keep runtime node_modules minimal
RUN npm prune --omit=dev

# ==========================================
# Stage 3: Production Runner
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Install runtime OpenSSL dependency for Prisma binaries
RUN apk add --no-cache openssl libc6-compat

# Copy pruned node_modules (includes generated Prisma client) & compiled code
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/prisma ./prisma

# Security: Run as non-root user
# USER node

# Default port for backend
EXPOSE 5001

# Start the compiled Node backend
CMD ["node", "dist/index.js"]
