# control-de-produccion-API


Control y gestión de la proucción. Carrduci Corporativo. 



## Notas

Este es el código necesario para establecer el backen conectado a MongoDB usando Mongoose.

Para ejecutarlo, es necesario reconstruir los módulos de node usando el comando ``` npm install```


## Modo produccion.

El modelo produccion requiere conexion ssl para funcionar. El la carpeta certificados estan los necesarios para desplegarlo bajo la ip 192.168.1.149. El rootCA.pem se debe instalar en cada equipo para no tener problemas con la camara aunque por lo pronto solo funciona con FireFox. 
