// bd.js
import dotenv from "dotenv"
dotenv.config()

import pg from "pg"
const { Pool } = pg

// Em produção (NODE_ENV==='production') usamos SSL com rejectUnauthorized:false
// Em dev (qualquer outro NODE_ENV), desabilitamos por completo
const isProd = process.env.NODE_ENV === "production"

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProd
    ? { rejectUnauthorized: false }
    : false,
})

pool.on("connect", () => {
  console.log("PostgreSQL conectado com sucesso")
})

pool.on("error", (err) => {
  console.error("Erro inesperado no cliente PostgreSQL:", err)
  process.exit(-1)
})

export default pool
