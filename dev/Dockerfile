FROM node:20-bookworm

WORKDIR /app

RUN corepack enable

ARG UID=1000
ARG GID=1000
RUN groupmod -o -g ${GID} node 2>/dev/null || true \
  && usermod -o -u ${UID} node 2>/dev/null || true

COPY src/package.json src/pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

USER node

EXPOSE 8082

CMD ["pnpm", "run", "dev"]
