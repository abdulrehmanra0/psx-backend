const axios = require('axios');
const cheerio = require('cheerio');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  try {
    const { data } = await axios.get('https://dps.psx.com.pk/', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    const $ = cheerio.load(data);
    const sectors = {};

    $('#listingsSectorFilter select option').each((i, el) => {
        const code = $(el).attr('value');
        const name = $(el).text().trim();
        if (code) { sectors[code] = name; }
    });

    res.setHeader('Cache-Control', 's-maxage=86400'); // Cache for 24 hours
    return res.status(200).json(sectors);
  } catch (e) { res.status(500).json({ error: 'Error' }); }
};