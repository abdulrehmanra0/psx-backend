// api/proxy.js
const axios = require('axios');
const cors = require('cors');

// Initialize CORS middleware
const corsMiddleware = cors({
  methods: ['GET', 'HEAD'],
  origin: '*', // Allow your Flutter app to access this
});

// Helper to run middleware
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

module.exports = async function handler(req, res) {
  // 1. Enable CORS
  await runMiddleware(req, res, corsMiddleware);

  // 2. Get the target URL from the query parameter
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    // 3. Fetch data from PSX
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    // 4. Set Cache-Control (Cache results for 60 seconds)
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');

    // 5. Return the data
    return res.status(200).json(response.data);

  } catch (error) {
    return res.status(500).json({ 
      error: 'Failed to fetch data', 
      details: error.message 
    });
  }
};