async function post(url) {
  try {
    const res = await fetch(url, { method: 'POST' });
    const text = await res.text();
    let body = text;
    try { body = JSON.parse(text); } catch (e) {}
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

(async function(){
  const base = 'http://localhost:3000';
  try {
    console.log('Fetching payments...');
    const resp = await fetch(`${base}/api/debug/payments?email=jagjeevan004@gmail.com`);
    if (!resp.ok) {
      console.error('Could not fetch payments', resp.status, await resp.text());
      return process.exitCode = 1;
    }
    const payments = await resp.json();
    console.log('Found', payments.length, 'payments');
    for (const p of payments) {
      console.log('\n--- Payment:', p._id, p.orderId);
      const byId = await post(`${base}/api/orders/${p._id}/cancel`);
      console.log('POST /api/orders/{payment._id}/cancel ->', byId.status || byId.error, JSON.stringify(byId.body || byId.error));
      const byOrderId = await post(`${base}/api/orders/${p.orderId}/cancel`);
      console.log('POST /api/orders/{orderId}/cancel ->', byOrderId.status || byOrderId.error, JSON.stringify(byOrderId.body || byOrderId.error));
    }
  } catch (e) {
    console.error('Error in script', e);
    process.exitCode = 2;
  }
})();
