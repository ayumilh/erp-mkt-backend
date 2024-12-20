const puppeteer = require('puppeteer');

try {
    // Extrai o link após a primeira barra
    const firstSlashIndex = link.indexOf('/');
    const extractedLink = link.substring(firstSlashIndex);

    // Inicia o Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Vai para o link extraído
    await page.goto(`https://www.google.com${extractedLink}`);

    // Tira o screenshot
    await page.screenshot({ path: 'example.png' });

    await browser.close();

    res.json({ message: 'Screenshot saved as example.png' });
  } catch (error) {
    console.error('Error capturing screenshot:', error);
    res.status(500).json({ error: 'Failed to capture screenshot' });
  };