FROM node:22-alpine
WORKDIR /app
COPY package.json ./
RUN npm install
COPY src ./src
EXPOSE 4000
CMD ["sh", "-c", "npm run seed && npm run start"]

