const Minio = require('minio');

const minioClient = new Minio.Client({
  endPoint: 'minio',
  port: 9000,
  useSSL: false,
  accessKey: 'minioadmin',
  secretKey: 'minioadmin'
});

const bucketName = 's2-trab1';

const ensureBucketExists = async (retries = 5) => {
  while (retries > 0) {
    try {
      const exists = await minioClient.bucketExists(bucketName);
      if (!exists) {
        await minioClient.makeBucket(bucketName, 'us-east-1');
        console.log(`Bucket ${bucketName} criado com sucesso.`);
      } else {
        console.log(`Bucket ${bucketName} já existe.`);
      }
      break;
    } catch (err) {
      console.error('Erro ao verificar/criar bucket:', err);
      retries--;
      console.log(`Tentando novamente... Restam ${retries} tentativas`);
      await new Promise(resolve => setTimeout(resolve, 5000)); 
    }
  }
  if (retries === 0) {
    console.error('Falha após várias tentativas de conexão com o MinIO');
  }
};

ensureBucketExists();