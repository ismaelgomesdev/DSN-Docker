const { Client } = require('pg');
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectWithRetry = async (client, retries = 5, delay = 3000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await client.connect();
      console.log('Conectado ao banco de dados PostgreSQL');
      return;
    } catch (err) {
      console.error('Falha na conexão ao banco de dados:', err.stack);
      console.log(`Tentando novamente em ${delay / 1000} segundos...`);
      await sleep(delay);
    }
  }
  throw new Error('Não foi possível conectar ao banco de dados após múltiplas tentativas');
};

const rdsClient = new Client({
  host: process.env.RDS_HOST,
  port: process.env.RDS_PORT,
  database: process.env.RDS_DB,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  connectionTimeoutMillis: 60000
});

const createProductsTable = async () => {
  const queryText =
    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT NOT NULL
    );`;

  try {
    await connectWithRetry(rdsClient);
    await rdsClient.query(queryText);
    console.log("Tabela 'products' criada com sucesso.");
  } catch (err) {
    console.error('Falha ao criar a tabela "products"', err.stack);
  }
};

module.exports = createProductsTable;
