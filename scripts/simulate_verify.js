#!/usr/bin/env node
import crypto from 'crypto';

const [,, orderIdArg, paymentIdArg] = process.argv;
if (!orderIdArg) {
  console.error('Usage: node simulate_verify.js <order_id> [payment_id]');
  process.exit(2);
}
const orderId = orderIdArg;
const paymentId = paymentIdArg || `pay_sim_${Math.floor(Date.now()/1000)}`;
const secret = process.env.RAZORPAY_KEY_SECRET || '8Itgf04RHIwCSwU3tEpNIxA6';
const signature = crypto.createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

const body = { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature };

const base = process.env.BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
const res = await fetch(base + '/api/payment/verify-payment', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body),
});
const json = await res.json();
console.log(JSON.stringify({ orderId, paymentId, signature, status: res.status, response: json }, null, 2));
