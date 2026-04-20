# Stage 1: Build the UI
FROM node:20-alpine AS ui-builder
WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/server/package.json ./packages/server/package.json

RUN npm ci --ignore-scripts

COPY packages/ui/ ./packages/ui/

RUN npm run build -w packages/ui

# Stage 2: Build the server
FROM node:20-alpine AS server-builder
WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/server/package.json ./packages/server/package.json

RUN npm ci --workspace=packages/server --ignore-scripts

COPY packages/server/ ./packages/server/
COPY --from=ui-builder /app/packages/server/public ./packages/server/public

RUN npm run build -w packages/server

# Stage 3: Runtime
FROM node:20-alpine
WORKDIR /app

COPY package.json .
COPY package-lock.json .
COPY packages/server/package.json ./packages/server/package.json

RUN npm ci --workspace=packages/server --omit=dev

COPY --from=server-builder /app/packages/server/dist ./packages/server/dist
COPY --from=server-builder /app/packages/server/public ./packages/server/public

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "packages/server/dist/bin.js"]
