// api/symbols.js
const axios = require('axios');
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

  try {
    // 1. Fetch the master list
    const url = 'https://dps.psx.com.pk/symbols';
    const { data } = await axios.get(url);

    // 2. Filter out Debt/Bonds (We only want stocks)
    // We only keep items where isDebt is FALSE
    const stocks = data.filter(item => item.isDebt === false);

    // 3. Map to a cleaner format
    const cleanList = stocks.map(item => ({
      symbol: item.symbol,
      name: item.name,
      sector: item.sectorName // This gives us "Commercial Banks" instead of "0807"
    }));

    // 4. Cache for 24 hours (Symbols rarely change)
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate');

    return res.status(200).json(cleanList);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch symbols' });
  }
};