FROM node:lts-slim

COPY src /src
COPY package-lock.json package.json /

RUN npm install --production

ENTRYPOINT ["node", "/lib/main.js"]
