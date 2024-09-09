# Dockerfile
# https://dev.to/andrews1022/build-an-express-app-using-bun-and-deploy-it-to-render-with-docker-3o04
# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 as base
RUN apt update \
    && apt install -y curl
ARG NODE_VERSION=20
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n    
WORKDIR /usr/src/app

# install dependencies into temp folder
# this will cache them and speed up future builds
FROM base AS install
# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lockb /temp/prod/
RUN cd /temp/prod && bun install --frozen-lockfile --production && bunx --bun prisma generate

# copy node_modules from temp folder
# then copy all (non-ignored) project files into the image
FROM install AS prerelease
COPY --from=install /temp/prod/node_modules node_modules
COPY . .
RUN apt update \
    && apt install -y curl
ARG NODE_VERSION=20
RUN curl -L https://raw.githubusercontent.com/tj/n/master/bin/n -o n \
    && bash n $NODE_VERSION \
    && rm n \
    && npm install -g n    
RUN ls -lah && sleep 10
RUN echo $PWD && sleep 10
RUN npx prisma generate && sleep 10
# RUN bunx prisma generate

# copy production dependencies and source code into final image
FROM base AS release
COPY --from=prerelease /usr/src/app/node_modules ./node_modules
COPY --from=prerelease /usr/src/app/index.ts .
COPY --from=prerelease /usr/src/app/lib ./lib
COPY --from=prerelease /usr/src/app/routes ./routes
COPY --from=prerelease /usr/src/app/package.json .

# run the app
USER bun
EXPOSE 3003/tcp
CMD ["bun", "index.ts"]