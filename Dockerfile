FROM node:20-alpine

WORKDIR /app

# cache deps
COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV PORT=5000
EXPOSE 5000

CMD ["node", "server.js"]
