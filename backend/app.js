const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { Client } = require('pg');
const Minio = require('minio');
const cors = require('cors');

const app = express();

// Configurar CORS
app.use(cors({ origin: 'http://localhost' }));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.static(path.join(__dirname, 'public')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const rdsClient = new Client({
  host: process.env.RDS_HOST,
  port: process.env.RDS_PORT,
  database: process.env.RDS_DB,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  connectionTimeoutMillis: 60000
});

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

const createProductsTable = async () => {
  const queryText =
    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      imageUrl TEXT NOT NULL
    );`;

  try {
    await rdsClient.query(queryText);
    console.log("Tabela 'products' criada com sucesso.");
  } catch (err) {
    console.error('Falha ao criar a tabela "products"', err.stack);
  }
};

const minioClient = new Minio.Client({
  endPoint: 'minio',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
});

app.post('/product', upload.single('image'), async (req, res) => {
  const file = req.file;
  const productId = uuidv4();
  const s3Params = {
    Bucket: process.env.S3_BUCKET,
    Key: productId,
    Body: file.buffer,
    ContentType: 'image/jpg'
  };

  try {
    await minioClient.putObject(s3Params.Bucket, s3Params.Key, s3Params.Body, function(err, etag) {
      if (err) {
        return res.status(500).send('Erro ao fazer upload da imagem: ' + err.message);
      }
      const imageUrl = `http://localhost:9000/${process.env.S3_BUCKET}/${productId}`;
      const sql = 'INSERT INTO products (id, name, description, imageUrl) VALUES ($1, $2, $3, $4)';
      rdsClient.query(sql, [productId, req.body.name, req.body.description, imageUrl])
        .then(() => {
          res.status(201).send('Produto criado com sucesso!');
        })
        .catch(err => {
          res.status(500).send('Erro ao salvar produto: ' + err.message);
        });
    });
  } catch (err) {
    res.status(500).send('Erro ao criar produto: ' + err.message);
  }
});

app.get('/products', async (req, res) => {
  const sql = 'SELECT * FROM products';
  try {
    const result = await rdsClient.query(sql);
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Erro ao buscar produtos: ' + err.message);
  }
});

app.get('/product/:id', async (req, res) => {
  const sql = 'SELECT * FROM products WHERE id = $1';
  try {
    const result = await rdsClient.query(sql, [req.params.id]);
    if (result.rows.length > 0) {
      res.json(result.rows[0]);
    } else {
      res.status(404).send('Produto não encontrado');
    }
  } catch (err) {
    res.status(500).send('Erro ao buscar produto: ' + err.message);
  }
});

app.put('/product/:id', upload.single('image'), async (req, res) => {
  const sql = 'UPDATE products SET name = $1, description = $2 WHERE id = $3';
  try {
    await rdsClient.query(sql, [req.body.name, req.body.description, req.params.id]);

    if (req.file) {
      const s3Params = {
        Bucket: process.env.S3_BUCKET,
        Key: req.params.id,
        Body: req.file.buffer,
        ContentType: req.file.mimetype
      };
      await minioClient.putObject(s3Params.Bucket, s3Params.Key, s3Params.Body);
    }

    res.send('Produto atualizado com sucesso!');
  } catch (err) {
    res.status(500).send('Erro ao atualizar produto: ' + err.message);
  }
});

app.delete('/product/:id', async (req, res) => {
  const sql = 'DELETE FROM products WHERE id = $1';
  try {
    await rdsClient.query(sql, [req.params.id]);

    const s3Params = {
      Bucket: process.env.S3_BUCKET,
      Key: req.params.id
    };
    await minioClient.removeObject(s3Params.Bucket, s3Params.Key);

    res.send('Produto removido com sucesso!');
  } catch (err) {
    res.status(500).send('Erro ao remover produto: ' + err.message);
  }
});

const startServer = async () => {
  await createProductsTable();
  app.listen(3000, () => {
    console.log('Servidor rodando na porta 3000');
  });
};

startServer();
