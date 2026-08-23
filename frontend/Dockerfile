FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --no-fund --no-audit

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "3000"]
