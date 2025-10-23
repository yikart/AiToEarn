FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY deps/ ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM node:22-alpine AS production

ARG APP_NAME

WORKDIR /app

COPY --from=deps /app/ ./

COPY apps/ ./apps/
COPY libs/ ./libs/
COPY assets/ ./
COPY config.js ./


ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD node apps/${APP_NAME}/src/main.js -c config.js
