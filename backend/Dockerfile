# ---- Build Stage ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install all dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy prisma schema and generate client
COPY prisma ./prisma
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

# Copy prisma schema (needed at runtime for migrations)
COPY prisma ./prisma

# Copy application source
COPY src ./src

# Expose port
EXPOSE 5000

# Start the server
CMD ["node", "src/server.js"]
