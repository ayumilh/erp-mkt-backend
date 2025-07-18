import "dotenv/config";
import express from "express";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import helmet from "helmet";
import session from "express-session";
import * as refresh from "./utils/refresh.js";
import rateLimit from "./middleware/rateLimiter.js";
import { authenticate } from './middleware/authMiddleware.js';

import configRoutes from "./routes/configRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import stockRoutes from "./routes/stock/stock.js";
import mercadoLivreRoutes from "./routes/mercadoLivre/mercadoLivreRoutes.js";
import magaluRoutes from "./routes/magalu/magaluRoutes.js";
import statistics from "./routes/utils/statistics.js";
import shopeeRoutes from "./routes/shopee/shopeeRoutes.js";

const allowedOrigins = [
  "https://toquasetedando.com",
  "http://localhost:3000"
];

const app = express();

app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(rateLimit);
app.use(bodyParser.json());
app.use(
  cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else callback(new Error("Not allowed by CORS"));
  },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization"],
  })
);
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send("Bem-vindo à página principal");
}); // Rota de teste Tela Principal

//mercado
app.use('/api/users', authenticate, usersRoutes);
app.use('/api/stock', authenticate, stockRoutes);
app.use('/api/mercadolivre', authenticate, mercadoLivreRoutes);
app.use('/api/magalu', authenticate, magaluRoutes);
app.use('/api/statistics', authenticate, statistics);
app.use('/api/config', authenticate, configRoutes);

//Shopee
app.use('/api/shopee', shopeeRoutes);

app.use('/api/auth', authRoutes);

const port = process.env.PORT || 4002
// Inicialização do servidor
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor com Socket.IO rodando na porta ${port}`);
});