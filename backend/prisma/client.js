import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

let prisma;

if (!global.prisma) {
  prisma = new PrismaClient();

  prisma.$connect()
    .then(() => console.log("Conectado ao PostgreSQL com Prisma"))
    .catch((err) => {
      console.error("Erro ao conectar no PostgreSQL com Prisma:", err);
      process.exit(1);
    });

  global.prisma = prisma;
} else {
  prisma = global.prisma;
}

export default prisma;
