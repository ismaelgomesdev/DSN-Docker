
# Projeto de Gestão de Produtos

Este projeto é uma aplicação web para a gestão de produtos, permitindo adicionar, visualizar, atualizar e remover produtos, incluindo o upload de imagens. O backend é desenvolvido em Node.js e o frontend é uma página estática em HTML. A aplicação utiliza PostgreSQL como banco de dados e MinIO como serviço de armazenamento de objetos.


# Pré-requisitos

Node.js

Docker

Docker Compose

# Como Executar o Projeto
Usando Docker Compose

A maneira mais fácil de executar a aplicação é usando o Docker Compose, que irá configurar e iniciar todos os serviços necessários.

Certifique-se de que você tenha o Docker e o Docker Compose instalados.

Clone este repositório;
Execute o comando para iniciar os serviços:


docker-compose up --build

Isso irá:

Construir e iniciar o backend na porta 3000

Construir e iniciar o frontend na porta 80

Iniciar um contêiner PostgreSQL

Iniciar um contêiner MinIO

Acesse a aplicação:


Frontend: http://localhost

Backend: http://localhost:3000

Endpoints da API

Produtos

GET /products: Retorna a lista de produtos.

GET /product/:id: Retorna um produto específico pelo ID.

POST /product: Cria um novo produto. Exige name, 
description e image (form-data).

PUT /product/:id: Atualiza um produto existente pelo ID. 
Pode incluir name, description e image (form-data).

DELETE /product/:id: Remove um produto pelo ID
