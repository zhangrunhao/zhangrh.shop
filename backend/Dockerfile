FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev || npm install --omit=dev

COPY server.js ./server.js
COPY projects ./projects

EXPOSE 3001
CMD ["node", "server.js"]
