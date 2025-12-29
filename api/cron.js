// api/cron.js
const axios = require('axios');
const cheerio = require('cheerio');
const admin = require('firebase-admin');

// 1. Initialize Firebase Admin (Only once)
if (!admin.apps.length) {
  // We parse the JSON string from Vercel Environment Variables
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
const messaging = admin.messaging();

module.exports = async function handler(req, res) {
  // 2. Security Check (Stop hackers)
  const { key } = req.query;
  if (key !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // 3. Fetch Real-Time Market Data (Scraping PSX)
    // We scrape directly here to ensure we have the freshest data instantly
    const { data: html } = await axios.get('https://dps.psx.com.pk/market-watch', {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });
    
    const $ = cheerio.load(html);
    const marketPrices = {}; // Map: "OGDC" -> 267.5

    // Parse the table
    $('tbody tr').each((i, row) => {
      const tds = $(row).find('td');
      const symbol = tds.eq(0).find('strong').text().trim();
      // Price is usually in the 8th column (index 7)
      let priceRaw = tds.eq(7).text().trim(); 
      // Clean price (remove commas)
      let price = parseFloat(priceRaw.replace(/,/g, ''));

      if (symbol && !isNaN(price)) {
        marketPrices[symbol] = price;
      }
    });

    // 4. Fetch Active Alerts from Firestore
    // Assumption: You store alerts in a collection named "alerts"
    // Document structure: { symbol: 'OGDC', targetPrice: 270, condition: 'ABOVE', fcmToken: '...', status: 'ACTIVE' }
    const alertsSnapshot = await db.collection('alerts')
      .where('status', '==', 'ACTIVE')
      .get();

    const notificationsToSend = [];
    const alertsToUpdate = [];

    // 5. Compare Prices
    alertsSnapshot.forEach(doc => {
      const alert = doc.data();
      const currentPrice = marketPrices[alert.symbol];

      if (currentPrice) {
        let triggered = false;

        if (alert.condition === 'ABOVE' && currentPrice >= alert.targetPrice) {
          triggered = true;
        } else if (alert.condition === 'BELOW' && currentPrice <= alert.targetPrice) {
          triggered = true;
        }

        if (triggered) {
          // Prepare Notification
          notificationsToSend.push(
            messaging.send({
              token: alert.fcmToken,
              notification: {
                title: `Price Alert: ${alert.symbol}`,
                body: `${alert.symbol} has reached ${currentPrice} (Target: ${alert.targetPrice})`
              },
              data: {
                screen: 'stock_detail',
                symbol: alert.symbol
              }
            })
          );

          // Mark alert as COMPLETED so we don't spam the user
          alertsToUpdate.push(db.collection('alerts').doc(doc.id).update({ status: 'COMPLETED', triggeredAt: new Date() }));
        }
      }
    });

    // 6. Execute Batch Operations
    await Promise.all(notificationsToSend);
    await Promise.all(alertsToUpdate);

    return res.status(200).json({
      status: 'Success',
      alertsChecked: alertsSnapshot.size,
      notificationsSent: notificationsToSend.length
    });

  } catch (error) {
    console.error('Cron Job Error:', error);
    return res.status(500).json({ error: error.message });
  }
};