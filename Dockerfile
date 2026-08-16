FROM --platform=linux/arm64 node:20-alpine

WORKDIR /usr/src/app

COPY src/package*.json ./
RUN npm install

COPY src .

ENV PORT=10000
EXPOSE 10000

CMD ["npm", "start"]
