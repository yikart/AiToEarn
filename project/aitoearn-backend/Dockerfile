FROM node:22-alpine AS deps

RUN npm install -g pnpm

WORKDIR /app

COPY deps/ ./

RUN pnpm install --prod --dangerously-allow-all-builds

FROM node:22-alpine AS production

ARG APP_NAME

RUN sed -i "s|https://dl-cdn.alpinelinux.org/alpine|http://mirrors.tencentyun.com/alpine|g; s|http://dl-cdn.alpinelinux.org/alpine|http://mirrors.tencentyun.com/alpine|g" /etc/apk/repositories && apk add --no-cache curl

WORKDIR /app

COPY assets/ ./
COPY --from=deps /app/ ./

COPY apps/ ./apps/
COPY libs/ ./libs/

ENV NODE_ENV=production
ENV APP_NAME=$APP_NAME

CMD ["sh", "-c", "node apps/${APP_NAME}/src/main.js -c config.js"]
