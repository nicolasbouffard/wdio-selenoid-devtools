FROM node:15.11.0-alpine3.13

RUN apk add --no-cache python3 make g++

COPY package.json .

RUN npm install

ENTRYPOINT ["npm", "start"]