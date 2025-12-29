// api/summary.js
const axios = require('axios');
const cheerio = require('cheerio');
const cors = require('cors');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    const { data } = await axios.get('https://dps.psx.com.pk/', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    const $ = cheerio.load(data);
    
    const indices = [];
    const marketBoards = [];

    // 1. Scrape the Top Indices (The scrolling bar items)
    $('.topIndices__item').each((i, el) => {
        const name = $(el).find('.topIndices__item__name').text().trim();
        const value = $(el).find('.topIndices__item__val').text().trim();
        const change = $(el).find('.topIndices__item__change').text().trim();
        const percentage = $(el).find('.topIndices__item__changep').text().trim();
        
        if (name) {
            indices.push({ name, value, change, percentage });
        }
    });

    // 2. Scrape the Market Boards (Regular, Debt, etc.)
    $('.markets__item').each((i, el) => {
        const title = $(el).find('.markets__item__title').text().trim();
        const state = $(el).find('.markets__item__stat div').eq(1).text().trim(); // Open/Closed
        const trades = $(el).find('.markets__item__stat div').eq(3).text().trim();
        const volume = $(el).find('.markets__item__stat div').eq(5).text().trim();
        const value = $(el).find('.markets__item__stat div').eq(7).text().trim();

        if (title) {
            marketBoards.push({ title, state, trades, volume, value });
        }
    });

    // 3. Current Server Time
    const serverTime = $('.topbar__status__label').first().text().trim();

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate');
    return res.status(200).json({
      serverTime,
      indices,
      marketBoards
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch dashboard summary' });
  }
};