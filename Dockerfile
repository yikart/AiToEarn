FROM node:lts AS base
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
WORKDIR /app
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN npm install -g pnpm @nestjs/cli
RUN pnpm add -g nx

FROM base AS deps-install
COPY .npmrc package.json ./

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install

COPY pnpm-*.yaml ./
COPY apps/${APP_NAME}/package.json apps/${APP_NAME}/package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install -F ${APP_NAME}

FROM deps-install AS build-app
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY nx.json ./
COPY tsconfig.base.json ./
COPY project.json ./
COPY apps/${APP_NAME} apps/${APP_NAME}

RUN --mount=type=cache,id=nx,target=/app/.nx/cache \
    pnpm nx build ${APP_NAME} --prod --excludeTaskDependencies

FROM base AS deps-prod
ARG APP_NAME
ENV APP_NAME=${APP_NAME}

COPY .npmrc ./
COPY apps/${APP_NAME}/package.json ./package.json

RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --prod

FROM node:lts-slim AS runtime
ARG APP_NAME
ENV APP_NAME=${APP_NAME}
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update && \
    if [ "$APP_NAME" = "aitoearn-cloud-space" ]; then \
        apt-get install -y curl gpg sshpass && \
        UBUNTU_CODENAME=jammy && \
        curl -fsSL "https://keyserver.ubuntu.com/pks/lookup?fingerprint=on&op=get&search=0x6125E2A8C77F2818FB7BD15B93C4A3FD7BB9C367" | gpg --dearmour -o /usr/share/keyrings/ansible-archive-keyring.gpg && \
        echo "deb [signed-by=/usr/share/keyrings/ansible-archive-keyring.gpg] http://ppa.launchpad.net/ansible/ansible/ubuntu $UBUNTU_CODENAME main" | tee /etc/apt/sources.list.d/ansible.list && \
        apt-get update && \
        apt-get install -y ansible && \
        apt-get clean; \
    fi

COPY --from=deps-prod /app/node_modules/ node_modules/

COPY --from=build-app /app/dist/apps/${APP_NAME}/ ./

RUN echo "require('./src/main.js')" > index.js

CMD ["node", "index.js"]
