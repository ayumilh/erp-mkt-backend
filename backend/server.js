const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require("cors");
const helmet = require('helmet');
const dotenv = require("dotenv");
const session = require('express-session');
const cron = require('./utils/refresh.js'); // Importando o arquivo com a função de atualização de tokens
const rateLimit = require('./middleware/rateLimiter.js');

app.use(helmet());
app.use(rateLimit);
app.use(bodyParser.json());
app.use(
  cors({
    origin: ["https://erp-mkt-frontend.vercel.app", "http://localhost:3000"],
    credentials: true,
  })
);
app.use(cookieParser());


//routes
const pool = require('./bd.js');
const authRoutes = require('./routes/authRoutes.js');
const configRoutes = require('./routes/configRoutes.js');
const usersRoutes = require('./routes/usersRoutes.js');
const stockRoutes = require('./routes/stock/stock.js');
const mercadoLivreRoutes = require('./routes/mercadoLivre/mercadoLivreRoutes.js');
const magaluRoutes = require('./routes/magalu/magaluRoutes.js');
const verifyToken = require('./routes/utils/utils.js');
const statistics = require('./routes/utils/statistics.js');

const shopeeRoutes = require('./routes/shopee/shopeeRoutes.js');

dotenv.config(); // Configuração automática do .env


app.get("/", (req, res) => {
  res.send("Bem-vindo à página principal");
}); // Rota de teste Tela Principal


// Rotas

//mercado
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/mercadolivre', mercadoLivreRoutes);
app.use('/api/magalu', magaluRoutes);
app.use('/api/', verifyToken);
app.use('/api/statistics', statistics);
app.use('/api/config', configRoutes);

//Shopee
app.use('/api/shopee', shopeeRoutes);


const port = process.env.PORT || 4002
// Inicialização do servidor
app.listen(port, () => {
  pool.connect(); // Conexão com o banco de dados
  console.log("Backend server está rodando!");
});