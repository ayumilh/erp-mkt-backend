const dotenv = require("dotenv");
dotenv.config(); // Configuração automática do .env
const { Pool } = require('pg'); // Importa o PostgreSQL

// Conexão com o PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        require: true,                        
        rejectUnauthorized: false
    }
});
const connect = async () => {
    try {
        await pool.connect();
        console.log("Conectei no PostgreSQL");
    } catch (error) {
        console.error("Erro ao conectar no PostgreSQL:", error);
        process.exit(1); // INICIANDO VERIFICAÇÂO COM O BANCO
    }
};

pool.on('error', (err, client) => {
    console.error('Erro inesperado no cliente PostgreSQL:', err);
    process.exit(-1);
});

pool.on('connect', () => {
    console.log('PostgreSQL conectado com sucesso');
}); // FINALIZANDO VERIFICAÇÂO COM O BANCO

module.exports = pool;