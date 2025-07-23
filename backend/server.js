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

const app = express();
app.set('trust proxy', 1);

// Carrega origens permitidas do .env
// EXEMPLO no .env:
// ALLOWED_ORIGINS=https://erp-mkt-frontend.vercel.app,https://leneoficial.com,http://localhost:3000
const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Sem origin (curl, Postman) ou origin na lista → permite  
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    console.warn(`Bloqueado por CORS: ${origin}`);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","DELETE","OPTIONS"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cookie"
  ],
};
app.use(cors(corsOptions));
// Habilita preflight para todas as rotas
app.options("*", cors(corsOptions));

// Segurança HTTP
app.use(helmet({ contentSecurityPolicy: false }));

// Rate limiter
app.use(rateLimit);

// Parsers
app.use(bodyParser.json());
app.use(cookieParser());

// Sessão (se precisar)
app.use(
  session({
    name: "sessionId",
    secret: process.env.SESSION_SECRET || "fallback_secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

// Rotas de teste
app.get("/", (req, res) => {
  res.send("Bem-vindo à página principal");
});

// Rotas autenticadas
app.use("/api/users", authenticate, usersRoutes);
app.use("/api/stock", authenticate, stockRoutes);
app.use("/api/mercadolivre", authenticate, mercadoLivreRoutes);
app.use("/api/magalu", authenticate, magaluRoutes);
app.use("/api/statistics", authenticate, statistics);
app.use("/api/config", authenticate, configRoutes);

// Shopee sem auth
app.use("/api/shopee", shopeeRoutes);

// Auth
app.use("/api/auth", authRoutes);

const port = process.env.PORT || 4002;
app.listen(port, "0.0.0.0", () => {
  console.log(`Servidor rodando na porta ${port}`);
});
