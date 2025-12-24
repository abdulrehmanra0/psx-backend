// api/home.js
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

  try {
    const url = 'https://dps.psx.com.pk/performers';
    const { data } = await axios.get(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0'
        }
    });

    const $ = cheerio.load(data);
    const result = {
      active: [],
      advancers: [],
      decliners: []
    };

    // Loop through each "Market Performance" heading
    $('.marketPerf__heading').each((index, heading) => {
        const title = $(heading).text().toUpperCase().trim();
        let sectionKey = '';

        if (title.includes('ACTIVE')) sectionKey = 'active';
        else if (title.includes('ADVANCERS')) sectionKey = 'advancers';
        else if (title.includes('DECLINERS')) sectionKey = 'decliners';

        if (sectionKey) {
            // FIX: Instead of looking at .next(), we look at the Parent container
            // and find the table inside it. This fixes the "Decliners" HTML bug.
            const container = $(heading).parent(); 
            const table = container.find('table');

            // Parse rows
            table.find('tbody tr').each((i, row) => {
                const cols = $(row).find('td');
                if (cols.length > 0) {
                    const symbol = cols.eq(0).find('strong').text().trim();
                    const price = cols.eq(1).text().trim();
                    const changeText = cols.eq(2).text().trim(); 
                    const volume = cols.eq(3).text().trim();

                    result[sectionKey].push({
                        symbol: symbol,
                        price: price,
                        change: changeText,
                        volume: volume
                    });
                }
            });
        }
    });

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
    return res.status(200).json(result);

  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch home stats', details: error.message });
  }
};



// // api/home.js
// const axios = require('axios');
// const cheerio = require('cheerio');
// const cors = require('cors');

// const corsMiddleware = cors({
//   methods: ['GET', 'HEAD'],
//   origin: '*',
// });

// function runMiddleware(req, res, fn) {
//   return new Promise((resolve, reject) => {
//     fn(req, res, (result) => {
//       if (result instanceof Error) return reject(result);
//       return resolve(result);
//     });
//   });
// }

// module.exports = async function handler(req, res) {
//   await runMiddleware(req, res, corsMiddleware);

//   try {
//     const url = 'https://dps.psx.com.pk/performers';
//     const { data } = await axios.get(url, {
//         headers: {
//             'User-Agent': 'Mozilla/5.0'
//         }
//     });

//     const $ = cheerio.load(data);
//     const result = {
//       active: [],
//       advancers: [],
//       decliners: []
//     };

//     // The HTML has multiple tables. We need to identify which is which.
//     // Usually they appear in order: Active, Advancers, Decliners.
//     // But let's be safe and look for the headers (h3).

//     // Loop through each "Market Performance" section
//     $('.marketPerf__heading').each((index, heading) => {
//         const title = $(heading).text().toUpperCase().trim();
//         let sectionKey = '';

//         if (title.includes('ACTIVE')) sectionKey = 'active';
//         else if (title.includes('ADVANCERS')) sectionKey = 'advancers';
//         else if (title.includes('DECLINERS')) sectionKey = 'decliners';

//         if (sectionKey) {
//             // Find the table immediately following this heading
//             // The structure is <h3>...</h3> <div><table>...</table></div>
//             const table = $(heading).next().find('table');

//             // Parse rows
//             table.find('tbody tr').each((i, row) => {
//                 const cols = $(row).find('td');
//                 if (cols.length > 0) {
//                     // Extract data
//                     const symbol = cols.eq(0).find('strong').text().trim();
//                     const price = cols.eq(1).text().trim();
                    
//                     // Change column has text like "0.87 (2.30%)"
//                     // We just want the whole text for display
//                     const changeText = cols.eq(2).text().trim(); 

//                     const volume = cols.eq(3).text().trim();

//                     result[sectionKey].push({
//                         symbol: symbol,
//                         price: price,
//                         change: changeText,
//                         volume: volume
//                     });
//                 }
//             });
//         }
//     });

//     res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate');
//     return res.status(200).json(result);

//   } catch (error) {
//     return res.status(500).json({ error: 'Failed to fetch home stats', details: error.message });
//   }
// };