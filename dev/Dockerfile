FROM node:20-bookworm

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.12.1 --activate

ARG UID=1000
ARG GID=1000
RUN groupmod -o -g ${GID} node 2>/dev/null || true \
  && usermod -o -u ${UID} node 2>/dev/null || true

COPY src/package.json src/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY src/ ./

USER node

EXPOSE 8082

CMD ["node_modules/.bin/ts-node-dev", "-r", "dotenv/config", "-r", "tsconfig-paths/register", "--respawn", "services/api/server.ts"]
