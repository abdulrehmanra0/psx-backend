// api/fundamentals.js
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
    return res.status(400).json({ error: 'Missing "symbol" parameter' });
  }

  try {
    const url = `https://dps.psx.com.pk/company/${symbol}`;
    
    // 1. Download the HTML page
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 2. Load HTML into Cheerio parser
    const $ = cheerio.load(data);

    let peRatio = "N/A";
    let eps = "N/A";
    let yearChange = "N/A";

    // 3. Find the data
    $('.stats_item').each((index, element) => {
        const label = $(element).find('.stats_label').text().trim();
        const value = $(element).find('.stats_value').text().trim();

        if (label.includes('P/E Ratio')) {
            peRatio = value;
        }
        if (label.includes('Earnings Per Share') || label.includes('EPS')) {
            eps = value;
        }
        if (label.includes('1-Year Change')) {
            yearChange = value;
        }
    });

    // 4. Cache this for 5 minutes
    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate');

    // 5. Return JSON
    return res.status(200).json({
      symbol: symbol,
      pe_ratio: peRatio,
      eps: eps,
      year_change: yearChange,
      source: "Vercel Scraper"
    });

  } catch (error) {
    return res.status(500).json({ error: 'Failed to scrape data' });
  }
};