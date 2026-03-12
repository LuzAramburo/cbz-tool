FROM node:20-alpine
WORKDIR /app

COPY package.json .
COPY packages/server/package.json ./packages/server/package.json

RUN npm install --workspace=packages/server

COPY packages/server/index.ts ./packages/server/
COPY packages/server/bin.ts ./packages/server/
COPY packages/server/tsconfig.json ./packages/server/
COPY packages/server/public ./packages/server/public

RUN npm run build -w packages/server

EXPOSE 3000
CMD ["node", "packages/server/dist/bin.js"]