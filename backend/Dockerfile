# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema and scripts
COPY prisma ./prisma
COPY scripts ./scripts

# Switch to PostgreSQL and generate client
RUN node scripts/prepare-deploy.js
RUN npx prisma generate

# ---- Production Stage ----
FROM node:20-alpine

WORKDIR /app

ENV NODE_ENV=production

# Copy package files and install production dependencies only
COPY package.json package-lock.json* ./
RUN npm ci --production

# Copy generated prisma client from build stage
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

# Copy prisma schema (needed at runtime for db push)
COPY --from=build /app/prisma ./prisma

# Copy scripts and application source
COPY scripts ./scripts
COPY src ./src

# Expose port
EXPOSE 5000

# Push schema to DB then start server
CMD ["sh", "-c", "npx prisma db push --accept-data-loss && node src/server.js"]
