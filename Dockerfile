FROM node:18
WORKDIR /app
COPY . .
RUN yarn install

ENTRYPOINT ["yarn", "start"]