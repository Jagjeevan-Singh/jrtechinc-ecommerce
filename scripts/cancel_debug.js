async function post(url) {
  try {
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (_e) {}
    return { ok: res.ok, status: res.status, body };
  } catch (_e) {
    return { ok: false, error: _e.message };
  }
}

(async function(){
  const base = process.env.BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
  try {
    const resp = await fetch(`${base}/api/debug/payments?email=jagjeevan004@gmail.com`);
    if (!resp.ok) {
      
      return process.exitCode = 1;
    }
    const payments = await resp.json();
    for (const p of payments) {
      await post(`${base}/api/orders/${p._id}/cancel`);
      
      await post(`${base}/api/orders/${p.orderId}/cancel`);
      
    }
  } catch (_e) {
    
    process.exitCode = 2;
  }
})();
