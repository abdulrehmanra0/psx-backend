// api/index.js
module.exports = (req, res) => {
  const baseUrl = `https://${req.headers.host}`;

  res.status(200).json({
    message: "Welcome to the PSX Unofficial API",
    status: "Running",
    endpoints: {
      market_watch: `${baseUrl}/api/market`,
      home_widgets: `${baseUrl}/api/home`,
      symbols_list: `${baseUrl}/api/symbols`,
      fundamentals: `${baseUrl}/api/fundamentals?symbol=OGDC`,
      proxy_example: `${baseUrl}/api/proxy?url=https://dps.psx.com.pk/timeseries/int/KSE100`
    },
    credits: "Built with Vercel Serverless Functions"
  });
};