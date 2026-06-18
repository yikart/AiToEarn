FROM node:24-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY deps/ ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM node:24-alpine AS production

ARG APP_NAME

RUN apk add --no-cache curl ffmpeg
RUN npm install -g pm2

WORKDIR /app

COPY assets/ ./
COPY --from=deps /app/ ./

COPY apps/ ./apps/
COPY libs/ ./libs/

ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD ["sh", "-c", "echo 'nameserver 8.8.8.8' >> /etc/resolv.conf && echo 'nameserver 1.1.1.1' >> /etc/resolv.conf && exec pm2-runtime start apps/${APP_NAME}/src/main.js --name ${APP_NAME} -- -c config.yaml"]
