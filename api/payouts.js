// api/payouts.js
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

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

  const { symbol } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    // This is the specific URL PSX uses for the Payouts tab
    const url = 'https://dps.psx.com.pk/company/payouts';
    
    // We must send the symbol as "Form Data" (POST request)
    const formData = new URLSearchParams();
    formData.append('symbol', symbol);

    const { data } = await axios.post(url, formData, {
      headers: {
        'User-Agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded' // Important!
      }
    });

    const $ = cheerio.load(data);
    const payouts = [];

    // Parse the table rows
    $('tbody tr').each((i, row) => {
      const tds = $(row).find('td');
      if (tds.length > 0) {
        payouts.push({
          year: tds.eq(0).text().trim(),
          type: tds.eq(1).text().trim(), // Dividend or Bonus
          value: tds.eq(2).text().trim(), // e.g., 5.00
          date: tds.eq(3).text().trim()   // e.g., 2024-12-01
        });
      }
    });

    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    return res.status(200).json(payouts);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payouts', details: error.message });
  }
};