FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --no-fund --no-audit

COPY . .

EXPOSE 5000

CMD ["npm", "start"]
