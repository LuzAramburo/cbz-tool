FROM node:22-alpine
WORKDIR /app

# Copy root package.json so npm knows this is a workspace
COPY package.json .
COPY packages/server/package.json ./packages/server/package.json

RUN npm install --workspace=packages/server

# Copy server source + built UI
COPY packages/server/index.js ./packages/server/
COPY packages/server/bin.js ./packages/server/
COPY packages/server/public ./packages/server/public

EXPOSE 3000
CMD ["node", "packages/server/bin.js"]