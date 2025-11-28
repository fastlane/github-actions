FROM node:lts-slim

WORKDIR /app

COPY . /app

RUN npm ci --omit=dev

ENTRYPOINT ["node", "/app/lib/main.js"]
