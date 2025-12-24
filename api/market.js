// api/market.js
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

// Setup CORS so your app can talk to this
const corsMiddleware = cors({
  methods: ['GET', 'HEAD'],
  origin: '*',
});

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

module.exports = async function handler(req, res) {
  await runMiddleware(req, res, corsMiddleware);

  try {
    // 1. Fetch the HTML table from PSX
    const url = 'https://dps.psx.com.pk/market-watch';
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 2. Load the HTML into Cheerio
    const $ = cheerio.load(data);
    const stocks = [];

    // 3. Loop through every row (tr) in the table body
    $('tbody tr').each((index, element) => {
      // We grab specific columns (td) based on the HTML you showed me
      const tds = $(element).find('td');

      // Extract text and clean it up
      const symbol = tds.eq(0).find('strong').text().trim(); // Column 0 has the Symbol
      const sector = tds.eq(1).text().trim();                // Column 1 is Sector Code
      const open = tds.eq(4).text().trim();                  // Column 4 is Open
      const current = tds.eq(7).text().trim();               // Column 7 is Current Price
      const change = tds.eq(8).text().trim();                // Column 8 is Change
      const pctChange = tds.eq(9).text().trim();             // Column 9 is Change %
      const volume = tds.eq(10).text().trim();               // Column 10 is Volume

      if (symbol) {
        stocks.push({
          symbol: symbol,
          sector_code: sector,
          price: current,
          open: open,
          change: change,
          pct_change: pctChange,
          volume: volume
        });
      }
    });

    // 4. Cache this for 10 seconds (Market moves fast!)
    res.setHeader('Cache-Control', 's-maxage=10, stale-while-revalidate');

    // 5. Return the clean list
    return res.status(200).json({
      count: stocks.length,
      data: stocks
    });

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to parse market data', 
      details: error.message 
    });
  }
};