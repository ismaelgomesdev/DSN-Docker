#!/bin/sh

# Lógica de espera para o Minio
host="minio"
port="9000"

until nc -z "$host" "$port"; do
  echo "Esperando $host:$port..."
  sleep 2
done

# Executar o script de inicialização do MinIO
node initMinio.js

# Iniciar a aplicação Node.js
exec node app.js
