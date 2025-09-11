FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY deps/ ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM node:22-alpine AS production

ARG APP_NAME
RUN apk add --no-cache curl gnupg openssh-client python3 py3-pip && \
    pip3 install --break-system-packages ansible && \
    apk del py3-pip;

WORKDIR /app

COPY --from=deps /app/ ./

COPY apps/ ./apps/
COPY libs/ ./libs/

ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD node apps/${APP_NAME}/src/main.js -c config.js
