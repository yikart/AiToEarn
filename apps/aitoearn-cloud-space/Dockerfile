FROM node:22-alpine AS base

RUN npm install -g pnpm

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY libs/ ./libs/
COPY apps/ ./apps/

RUN pnpm install --prod --frozen-lockfile

FROM node:22-alpine AS production

ARG APP_NAME
RUN apk add --no-cache curl gnupg openssh-client python3 py3-pip && \
    pip3 install --break-system-packages ansible && \
    apk del py3-pip && \
    rm -rf /var/cache/apk/*;

WORKDIR /app

COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/apps ./apps
COPY --from=base /app/libs ./libs

ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD node apps/${APP_NAME}/main.js