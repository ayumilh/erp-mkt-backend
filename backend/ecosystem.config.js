// ecosystem.config.js
module.exports = {
  apps: [{
    name: "simk-backend",
    script: "./server.js",
    env: {
      NODE_ENV: "production",
      ALLOWED_ORIGINS:
        "https://erp-mkt-frontend.vercel.app,https://leneoficial.com,http://localhost:3000",
      CLIENT_ID: "...",
      CLIENT_SECRET: "...",
      BETTER_AUTH_SECRET: "..."
    }
  }]
}
