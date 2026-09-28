# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1: build - install all dependencies, build the Vite/React bundle,
# then prune devDependencies so only production node_modules remain.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build

# Strip devDependencies (vite, react plugin, oxlint, etc.) - only the
# Express runtime dependency is needed to actually run the server.
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# Stage 2: runtime - minimal image containing only what's needed to serve
# the built app: the production node_modules, the Express server, and the
# compiled dist/ output. Runs as a non-root user.
# ---------------------------------------------------------------------------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Create a dedicated non-root user/group to run the app.
RUN addgroup -S towerdefense && adduser -S towerdefense -G towerdefense

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/server ./server

USER towerdefense

EXPOSE 8080

CMD ["node", "server/server.js"]
