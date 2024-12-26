const toobusy = require('toobusy-js');

toobusy.maxLag(1000)

const toobusyMiddleware = (req, res, next) => {
  if (toobusy()) {
    res.status(503).send("Servidor muito ocupado. Tente novamente mais tarde.");
  } else {
    next();
  }
};

module.exports = toobusyMiddleware;