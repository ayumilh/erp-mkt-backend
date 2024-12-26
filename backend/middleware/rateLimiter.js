const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 solicitações por IP por janela de 15 minutos
  message: 'Muitas solicitações criadas a partir deste IP, por favor tente novamente após 15 minutos'
});

module.exports = limiter;