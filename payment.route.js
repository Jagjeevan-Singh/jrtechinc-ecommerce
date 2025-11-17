import express from "express";
import crypto from "crypto";
import Payment from "./payment.model.js";   // ✅ Correct Import
import { Product, Order } from "./product.model.js";

const router = express.Router();

// ✅ Create Razorpay Order
router.post("/create-order", async (req, res) => {
  try {
  const { amount, currency, receipt, userEmail } = req.body || {};
  const items = req.body?.items || [];
    

    // Validate amount
    const numericAmount = Number(amount);
    if (!numericAmount || isNaN(numericAmount) || numericAmount <= 0) {
      console.warn('Invalid amount sent to create-order:', amount);
      return res.status(400).json({ message: 'Invalid amount' });
    }

    // Prepare options for Razorpay: amount must be in paise (integer)
    const options = {
      amount: Math.round(numericAmount * 100),
      currency: (currency && String(currency).toUpperCase()) || 'INR',
      receipt: receipt || `rcpt_${Date.now()}`,
    };
      
      // If Razorpay keys are not configured, return a deterministic mock order
      // so the frontend can proceed in local/dev without real Razorpay credentials.
      if (!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
        console.warn('Razorpay keys missing; returning a mock order for local development.');
        const mockOrder = {
          id: `order_dev_${Date.now()}`,
          amount: options.amount,
          currency: options.currency,
          receipt: options.receipt,
          status: 'created',
          mock: true,
        };
        
        try {
          const userId = req.body?.userId || null;
          await Payment.create({
            orderId: mockOrder.id,
            amount,
            currency: options.currency,
            receipt: options.receipt,
            userEmail,
            userId,
            status: 'created',
            mock: true,
            items
          });
        } catch (dbErr) {
          console.warn('Warning: could not persist mock Payment record (DB may be down):', dbErr && dbErr.message);
        }
        
        return res.status(200).json({ success: true, order: mockOrder, key: null, mock: true });
      }

    let order;
    try {
      
      // Create real order with Razorpay via direct REST call (avoid SDK auth issues)
      try {
        const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
        const form = new URLSearchParams({ amount: String(options.amount), currency: options.currency, receipt: options.receipt }).toString();
        const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: form
        });
        const rpJson = await rpRes.json();
        if (!rpRes.ok) {
          console.error('Razorpay REST create order failed:', rpJson);
          throw rpJson;
        }
        order = rpJson;
      } catch (rpErr) {
        console.error('Razorpay order creation failed (REST):', rpErr && (rpErr.message || rpErr));
        if (rpErr && rpErr.error) console.error('Razorpay error details:', rpErr.error);
        return res.status(502).json({ message: 'Failed to create order with Razorpay', error: (rpErr && (rpErr.error || rpErr.message)) || String(rpErr) });
      }
    } catch (rpErr) {
      // Log full error payload for debugging (Razorpay SDK often provides a body)
      console.error('Razorpay order creation failed:', rpErr && (rpErr.message || rpErr));
      if (rpErr && rpErr.error) console.error('Razorpay error details:', rpErr.error);
      return res.status(502).json({ message: 'Failed to create order with Razorpay', error: (rpErr && (rpErr.error || rpErr.message)) || String(rpErr) });
    }

    // Try to persist payment record, but don't fail the request if DB is unreachable
    try {
      // Accept optional shipping/customer info if the client sent it (checkout form)
      const shipping = req.body?.shipping || req.body?.customer?.address || null;
      const deliveryAddress = req.body?.deliveryAddress || null;
      const userId = req.body?.userId || null;
      await Payment.create({
        orderId: order.id,
        amount,
        currency,
        receipt,
        userEmail,
        userId,
        status: "created",
        items,
        shipping,
        deliveryAddress
      });
    } catch (dbErr) {
      console.warn('Warning: could not persist Payment record (DB may be down or auth failed):', dbErr && dbErr.message);
    }

    // Return a predictable shape: { success: true, order: { ... }, key }
    // This avoids accidental top-level field collisions and makes the client
    // code more robust when locating the order id.
    return res.status(200).json({ success: true, order: order, key: process.env.RAZORPAY_KEY_ID || null });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// No convenience/mock endpoints — use POST /create-order and POST /verify-payment
// for production flows. Development mock routes were removed to avoid accidental
// mock usage in staging/production.
// ✅ Verify Razorpay Signature
router.post("/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};

  // Helper to create Order from a payment record (returns created order)
  // This normalizes items and paymentEvents to satisfy the Order schema.
  const createOrderFromPayment = async (paymentRecord, suppliedPaymentId) => {
    // Normalize items (ensure variantSku, variantName, name, price, quantity)
    const normalizedItems = [];
    if (paymentRecord?.items && Array.isArray(paymentRecord.items)) {
      for (const it of paymentRecord.items) {
        try {
          let variantSku = it.variantSku || '';
          let variantName = it.variantName || '';
          let name = it.name || '';
          let price = (typeof it.price === 'number') ? it.price : (it.price ? Number(it.price) : 0);
          const quantity = (typeof it.quantity === 'number' && it.quantity > 0) ? it.quantity : (it.quantity ? Number(it.quantity) : 1);

          if ((!variantSku || !variantName || !name || !price) && it.productId) {
            try {
              const prod = await Product.findById(it.productId).lean();
              if (prod) {
                let matchedVariant = null;
                if (variantSku) matchedVariant = (prod.variants || []).find(v => v.sku === variantSku);
                if (!matchedVariant && prod.variants && prod.variants.length) matchedVariant = prod.variants[0];

                if (!variantSku && matchedVariant) variantSku = matchedVariant.sku || variantSku;
                if (!variantName && matchedVariant) variantName = matchedVariant.variantName || variantName;
                name = name || prod.name;
                price = price || (matchedVariant && matchedVariant.variantPrice) || prod.discountedPrice || prod.mrp || price;
              }
            } catch (_e) {}
          }

          if (!variantName && variantSku) {
            try {
              const prodBySku = await Product.findOne({ 'variants.sku': variantSku }).lean();
              if (prodBySku) {
                const v = (prodBySku.variants || []).find(vv => vv.sku === variantSku);
                if (v) variantName = v.variantName || variantName;
                name = name || prodBySku.name;
                price = price || v?.variantPrice || prodBySku.discountedPrice || prodBySku.mrp || price;
              }
            } catch (_e) {}
          }

          if (!variantSku) variantSku = `unknown_sku_${Date.now()}`;
          variantName = variantName || 'Default Variant';
          name = name || 'Unknown Product';
          price = price || 0;

          normalizedItems.push({ productId: it.productId || undefined, variantSku, variantName, name, price, quantity });
        } catch (_e) {
          normalizedItems.push({ productId: it.productId || undefined, variantSku: '', variantName: 'Default Variant', name: it.name || 'Unknown', price: Number(it.price) || 0, quantity: Number(it.quantity) || 1 });
        }
      }
    }

    // Normalize payment events to enum: ['Attempt','Success','Failure']
    const mapEventStatus = s => {
      if (!s) return 'Attempt';
      const low = String(s).toLowerCase();
      if (low === 'paid' || low === 'success' || low === 'succeeded') return 'Success';
      if (low === 'failed' || low === 'failure' || low === 'error') return 'Failure';
      if (low === 'created' || low === 'attempt' || low === 'pending') return 'Attempt';
      return 'Attempt';
    };

    const normalizedPaymentEvents = [];
    if (paymentRecord?.paymentEvents && Array.isArray(paymentRecord.paymentEvents) && paymentRecord.paymentEvents.length) {
      for (const ev of paymentRecord.paymentEvents) {
        try {
          normalizedPaymentEvents.push({ timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(), status: mapEventStatus(ev.status), details: ev.details || (ev.message || '') });
        } catch (_e) {
          normalizedPaymentEvents.push({ timestamp: new Date(), status: 'Attempt', details: 'Imported event' });
        }
      }
    } else {
      normalizedPaymentEvents.push({ timestamp: new Date(), status: mapEventStatus(paymentRecord?.status), details: 'Verified payment' });
    }

    const orderDoc = new Order({
      userId: paymentRecord?.userId || 'demo_user_12345',
      orderId: paymentRecord?.orderId || paymentRecord?._id || null,
      paymentId: suppliedPaymentId || paymentRecord?.paymentId || null,
      userEmail: paymentRecord?.userEmail || null,
      status: paymentRecord?.status === 'paid' ? 'paid' : (paymentRecord?.status || 'created'),
      items: normalizedItems,
      shipping: paymentRecord?.shipping || undefined,
      deliveryAddress: paymentRecord?.deliveryAddress || undefined,
      totalAmount: Number(paymentRecord?.amount) || 0,
      paymentStatus: (mapEventStatus(paymentRecord?.status) === 'Success') ? 'Paid' : (mapEventStatus(paymentRecord?.status) === 'Failure' ? 'Failed' : 'Pending'),
      paymentEvents: normalizedPaymentEvents,
      orderStatus: 'Processing'
    });

    await orderDoc.save();
    return orderDoc;
  };

  // MOCK / DEV flow: accept 'order_dev_' ids without HMAC
  if (typeof razorpay_order_id === 'string' && razorpay_order_id.startsWith('order_dev_')) {
    
    try {
      // Persist any shipping/deliveryAddress/userEmail provided at verify time
      const upd = { status: 'paid', paymentId: razorpay_payment_id || `mockpay_${Date.now()}` };
      if (req.body?.shipping) upd.shipping = req.body.shipping;
      if (req.body?.deliveryAddress) upd.deliveryAddress = req.body.deliveryAddress;
      if (req.body?.userEmail) upd.userEmail = req.body.userEmail;

      await Payment.findOneAndUpdate({ orderId: razorpay_order_id }, upd, { upsert: false });
    } catch (e) {
      console.error('Failed to update Payment during mock verify:', e);
      console.error(e.stack || e);
      return res.status(500).json({ success: false, message: 'Failed to update Payment during mock verification', error: e.message });
    }

    // Ensure Order exists
    try {
      const paymentRecord = await Payment.findOne({ orderId: razorpay_order_id }).lean();
      if (!paymentRecord) return res.status(404).json({ success: false, message: 'Payment record not found for mock order' });

      const existingOrder = await Order.findOne({ orderId: razorpay_order_id }).lean();
      if (!existingOrder) {
        try {
          const created = await createOrderFromPayment(paymentRecord, razorpay_payment_id);
          
        } catch (saveErr) {
          console.error('Failed to save Order document for mock verification:', saveErr);
          console.error(saveErr.stack || saveErr);
          return res.status(500).json({ success: false, message: 'Failed to create Order during mock verification', error: saveErr.message });
        }
      }
      return res.status(200).json({ success: true, message: 'Mock payment verified' });
    } catch (orderErr) {
      console.error('Error creating Order for mock verification:', orderErr);
      console.error(orderErr.stack || orderErr);
      return res.status(500).json({ success: false, message: 'Error creating Order during mock verification', error: orderErr.message });
    }
  }

  // Real Razorpay verification (HMAC)
  try {
    const hash = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (hash !== String(razorpay_signature)) {
      // Mark payment failed and return 400
      try { await Payment.findOneAndUpdate({ orderId: razorpay_order_id }, { status: 'failed' }); } catch (_e) { console.error('Failed to mark Payment failed:', _e); }
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Signature valid — update Payment record with optional customer info
    const upd = { status: 'paid', paymentId: razorpay_payment_id };
    if (req.body?.shipping) upd.shipping = req.body.shipping;
    if (req.body?.deliveryAddress) upd.deliveryAddress = req.body.deliveryAddress;
    if (req.body?.userEmail) upd.userEmail = req.body.userEmail;

    const paymentRecord = await Payment.findOneAndUpdate({ orderId: razorpay_order_id }, upd, { new: true });

    // Create Order if missing
    try {
      const existingOrder = await Order.findOne({ orderId: razorpay_order_id }).lean();
      if (!existingOrder) {
        if (!paymentRecord) {
          console.warn('Payment record missing while creating Order for:', razorpay_order_id);
        }
        try {
          const created = await createOrderFromPayment(paymentRecord || { orderId: razorpay_order_id, amount: 0, items: [] }, razorpay_payment_id);
          
        } catch (saveErr) {
          console.error('Failed to save Order document after payment verification:', saveErr);
          console.error(saveErr.stack || saveErr);
          return res.status(500).json({ success: false, message: 'Failed to create Order after payment verification', error: saveErr.message });
        }
      }
      return res.status(200).json({ success: true, message: 'Payment verified' });
    } catch (orderErr) {
      console.error('Error creating Order document after payment verification:', orderErr);
      console.error(orderErr.stack || orderErr);
      return res.status(500).json({ success: false, message: 'Error creating Order after payment verification', error: orderErr.message });
    }
  } catch (err) {
    console.error('verify-payment handler unexpected error:', err);
    console.error(err.stack || err);
    return res.status(500).json({ success: false, message: 'Internal server error during payment verification', error: err.message });
  }
});

// Temporary test route: create a small Razorpay order and return raw response.
// Use this to quickly validate server-side Razorpay credentials and payloads.
router.get('/test-create-order', async (req, res) => {
  try {
    const options = { amount: 100, currency: 'INR', receipt: `test_rcpt_${Date.now()}` };
    

    if (!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)) {
      console.warn('test-create-order: Razorpay keys missing, returning mock order');
      const mockOrder = { id: `order_dev_${Date.now()}`, amount: options.amount, currency: options.currency, receipt: options.receipt, status: 'created', mock: true };
      return res.json({ success: true, order: mockOrder, mock: true });
    }

  
    // Create via REST API to ensure correct Basic Auth is used
    try {
      const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');
      const form = new URLSearchParams({ amount: String(options.amount), currency: options.currency, receipt: options.receipt }).toString();
      const rpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: form
      });
      const rpJson = await rpRes.json();
      if (!rpRes.ok) {
        console.error('test-create-order failed:', rpJson);
        throw rpJson;
      }
      const order = rpJson;
      
      return res.json({ success: true, order });
    } catch (rpErr) {
      console.error('test-create-order REST call failed:', rpErr);
      return res.status(502).json({ success: false, message: 'Failed to create test order with Razorpay', error: (rpErr && (rpErr.error || rpErr.message)) || String(rpErr) });
    }
  } catch (err) {
    console.error('test-create-order unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Internal error in test-create-order', error: err.message });
  }
});

export default router;