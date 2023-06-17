FROM keymetrics/pm2:latest-alpine
ENV NPM_CONFIG_LOGLEVEL warn
ENV NODE_ENV=production

RUN mkdir /app
WORKDIR /app

#Aquí se deben guardar los certificados
RUN mkdir /configuracion

# Copiamos al api
COPY . api/

WORKDIR /app/api
RUN npm ci

WORKDIR /app
RUN ls -al 

CMD [ "pm2-runtime", "start", "configuracion/ecosystem.config.js" ]