FROM node:lts AS base
ARG APP_NAME
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm @nestjs/cli

FROM base AS build

COPY package.json pnpm-*.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile;

COPY nest-cli.json tsconfig.json ./
COPY src ./src
COPY config ./config

RUN nest build;

FROM base AS prod-deps
ARG APP_NAME

COPY package.json pnpm-*.yaml ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm i --frozen-lockfile --prod;

FROM node:lts-slim AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json ./

COPY --from=build /app/dist/ dist

COPY --from=prod-deps /app/node_modules/ node_modules

RUN echo "require('./dist/main.js')" > index.js

CMD node index.js -c config.js