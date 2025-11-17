import http from 'http';

function postJson(url) {
  return new Promise((resolve, reject) => {
    try {
      const u = new URL(url);
      const opts = { method: 'POST', hostname: u.hostname, port: u.port, path: u.pathname + (u.search || '') };
      const req = http.request(opts, (res) => {
        let b = '';
        res.on('data', c => b += c);
        res.on('end', () => {
          let parsed = b;
          try { parsed = JSON.parse(b); } catch (_e) {}
          resolve({ status: res.statusCode, body: parsed });
        });
      });
      req.on('error', (e) => reject(e));
      req.end();
    } catch (e) { reject(e); }
  });
}

(async function(){
  const base = process.env.BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
  const tests = [
    { label: 'By Payment._id', url: `${base}/api/orders/69074e5de623c8a239843724/cancel` },
    { label: 'By Razorpay orderId', url: `${base}/api/orders/order_Ras64aMTlh2hPg/cancel` }
  ];

  for (const t of tests) {
    try {
      await postJson(t.url);
    } catch (_e) {
    }
  }
})();
