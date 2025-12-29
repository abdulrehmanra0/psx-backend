// api/index.js
module.exports = (req, res) => {
  const baseUrl = `https://${req.headers.host}`;

  res.status(200).json({
    message: "Welcome to the PSX Unofficial API",
    status: "Running",
    endpoints: {
      // --- DASHBOARD ---
      summary: `${baseUrl}/api/summary`,           // Ticker & Market Status
      home_widgets: `${baseUrl}/api/home`,         // Top Active, Gainers, Losers
      market_watch: `${baseUrl}/api/market`,       // Full Market List (500+ Stocks)

      // --- SEARCH & METADATA ---
      symbols_list: `${baseUrl}/api/symbols`,      // All Symbols (for Search Bar)
      sectors_map: `${baseUrl}/api/sectors`,       // Sector Codes to Names

      // --- STOCK DETAILS ---
      fundamentals: `${baseUrl}/api/fundamentals?symbol=OGDC`, // P/E, EPS, Valuation
      payouts: `${baseUrl}/api/payouts?symbol=OGDC`,          // Dividends History

      // --- GRAPHS (Via Proxy) ---
      // Use these URLs for your Charts
      graph_intraday: `${baseUrl}/api/proxy?url=https://dps.psx.com.pk/timeseries/int/OGDC`, // Line Chart (Today)
      graph_history: `${baseUrl}/api/proxy?url=https://dps.psx.com.pk/timeseries/eod/OGDC`,  // Candle Chart (1 Year)

      // --- UTILITIES ---
      proxy_tool: `${baseUrl}/api/proxy?url=ANY_PSX_URL` // Universal Proxy
    },
    credits: "Built with Vercel Serverless Functions",
    developer: "Abdul Rehman"
  });
};

// // api/index.js
// module.exports = (req, res) => {
//   const baseUrl = `https://${req.headers.host}`;

//   res.status(200).json({
//     message: "Welcome to the PSX Unofficial API",
//     status: "Running",
//     endpoints: {
//       // New Summary API (Status & Indices)
//       summary: `${baseUrl}/api/summary`,
      
//       // Top Performers (Active, Gainers, Losers)
//       home_widgets: `${baseUrl}/api/home`,
      
//       // The Big Market List (JSON)
//       market_watch: `${baseUrl}/api/market`,
      
//       // Sector Mapper ("0807" -> "Commercial Banks")
//       sectors_map: `${baseUrl}/api/sectors`,
      
//       // Full list of Companies (Search)
//       symbols_list: `${baseUrl}/api/symbols`,
      
//       // Company Details (P/E Ratio, EPS)
//       fundamentals: `${baseUrl}/api/fundamentals?symbol=OGDC`,
      
//       // Universal Proxy for Graphs & Raw Data
//       proxy_example: `${baseUrl}/api/proxy?url=https://dps.psx.com.pk/timeseries/int/KSE100`
//     },
//     credits: "Built with Vercel Serverless Functions",
//     developer: "Abdul Rehman"
//   });
// };
