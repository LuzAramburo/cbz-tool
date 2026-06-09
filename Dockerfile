# Stage 1: Build the UI
FROM node:22-alpine AS ui-builder
WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/server/package.json ./packages/server/package.json
COPY packages/desktop/package.json ./packages/desktop/package.json

RUN pnpm install --frozen-lockfile --filter @cbz-tool/ui --ignore-scripts

COPY packages/ui/ ./packages/ui/

RUN pnpm --filter @cbz-tool/ui build

# Stage 2: Build the server
FROM node:22-alpine AS server-builder
WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/server/package.json ./packages/server/package.json
COPY packages/desktop/package.json ./packages/desktop/package.json

RUN pnpm install --frozen-lockfile --filter @cbz-tool/server --ignore-scripts

COPY packages/server/ ./packages/server/
COPY --from=ui-builder /app/packages/server/public ./packages/server/public

RUN pnpm --filter @cbz-tool/server build

# Stage 3: Runtime
FROM node:22-alpine
WORKDIR /app

RUN npm install -g pnpm@11

COPY package.json .
COPY pnpm-lock.yaml .
COPY pnpm-workspace.yaml .
COPY packages/ui/package.json ./packages/ui/package.json
COPY packages/server/package.json ./packages/server/package.json
COPY packages/desktop/package.json ./packages/desktop/package.json

RUN pnpm install --frozen-lockfile --filter @cbz-tool/server --prod

COPY --from=server-builder /app/packages/server/dist ./packages/server/dist
COPY --from=server-builder /app/packages/server/public ./packages/server/public

ENV DATA_DIR=/app/data
RUN mkdir -p /app/data

EXPOSE 3000
CMD ["node", "packages/server/dist/bin.js"]
