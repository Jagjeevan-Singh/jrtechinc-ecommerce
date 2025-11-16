// src/components/CheckoutButton.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import './CheckoutButton.css';

const CheckoutButton = ({ amount, items = [], user, customer }) => {
  const navigate = useNavigate();

  const handlePay = async () => {
    if (!amount || amount <= 0) return alert('Invalid amount');

    // 1) create order on server — send the actual amount and items so server can snapshot them
    // Support either `user` or `customer` props (different pages pass different names).
    const customerInfo = user || customer || {};
    // Normalize shipping / deliveryAddress info if provided by the checkout form (customer.address)
    let shipping = null;
    let deliveryAddress = null;
    try {
      const addr = customerInfo.address || {};
      if (addr) {
        const street = [addr.addressLine1 || addr.street || addr.streetAddress, addr.addressLine2 || addr.addressLineTwo].filter(Boolean).join(', ');
        shipping = { name: customerInfo.name || addr.fullName || addr.fullname || '', email: customerInfo.email || addr.email || '', street, city: addr.city || addr.town || '', zip: addr.zip || addr.postal || '' };
        deliveryAddress = {
          fullName: customerInfo.name || addr.fullName || addr.fullname || '',
          phone: customerInfo.phone || addr.phone || addr.contact || '',
          street,
          city: addr.city || addr.town || '',
          state: addr.state || addr.region || '',
          postalCode: addr.zip || addr.postal || ''
        };
      }
    } catch (e) {
      shipping = null;
      deliveryAddress = null;
    }

    const clientUserId = customerInfo?.uid || (auth && auth.currentUser && auth.currentUser.uid) || null;
  const BACKEND_HOST = import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
  const response = await fetch(BACKEND_HOST + '/api/payment/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount, // amount in rupees
        currency: 'INR',
        // server will generate a receipt if not provided, but sending one helps debugging
        receipt: `rcpt_${Date.now()}`,
        userEmail: customerInfo?.email || user?.email || '',
        userId: clientUserId,
        items: items || [],
        // Include shipping snapshot when available so backend can later create Orders with address
        shipping,
        // Include structured deliveryAddress with expected field names used by backend
        deliveryAddress
      }),
    });
    const data = await response.json();
    console.log('create-order response:', data);

    // If server returned an error shape (e.g. missing Razorpay keys), abort
    if (data && data.success === false) {
      console.error('Server returned error when creating order:', data);
      const pretty = (data.error && (data.error.description || data.error)) || data.message || JSON.stringify(data);
      return alert('Could not create order: ' + pretty + '\n\nIf this mentions missing Razorpay keys, set RAZORPAY_KEY_ID and RAZORPAY_SECRET in the server .env.');
    }

    // Try to extract the order id from common locations. Prefer server.order.id
    const orderId = data && (data.order?.id || data.id || data.order_id || data.result?.id);
    if (!orderId) {
      console.error('Create order response missing order id. Full response:', data);
      return alert('Could not create order (no order id returned). Check server logs.');
    }
    // If server didn't return a key and the client doesn't have one configured,
    // and this is not a dev/mock order, inform the developer and abort so we
    // don't open Razorpay without valid credentials (which leads to keyless_auth errors).
    const clientKey = import.meta.env.VITE_RAZORPAY_KEY || '';
    const serverKey = data && data.key;
    if (!clientKey && !serverKey && !(data && data.mock === true)) {
      console.error('No Razorpay key found on server or client. Response:', data);
      return alert('Razorpay keys are not configured. To enable real payments, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in the server .env (and optionally VITE_RAZORPAY_KEY for the frontend) and restart the server.');
    }
  // 2) prepare options for Razorpay checkout
    const options = {
      // Prefer server-provided key (returned with the order). Fall back to
      // client-side Vite env if server didn't provide a key.
  key: (data && data.key) || import.meta.env.VITE_RAZORPAY_KEY || '',
  amount: data.amount || Math.round(amount * 100), // paise
      currency: data.currency || 'INR',
      name: 'JR Tech Inc.',
      description: 'Order Payment',
  order_id: orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || 'jrtechinc21@gmail.com',
        contact: user?.phone || '8527914649'
      },
      theme: { color: '#8C5230' },
      retry: { enabled: true, max_count: 3 }, // razorpay retry
      handler: async function (response) {
        // response: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
        try {
          // Include shipping/deliveryAddress and userEmail so the server can persist
          // customer details on the Payment/Order even if the Payment record was
          // created earlier without them (helps dev/mock flows and race conditions).
          const verifyPayload = {
            ...response,
            shipping,
            deliveryAddress,
            userEmail: customerInfo?.email || ''
          };
          const verifyRes = await fetch(BACKEND_HOST + '/api/payment/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(verifyPayload)
          });
          const verifyData = await verifyRes.json();
          if (verifyData && verifyData.success) {
            // payment verified server-side — navigate to success page with
            // the Razorpay order id returned in the handler response.
            navigate('/order-success', { state: { orderId: response.razorpay_order_id } });
          } else {
            // verification failed
            alert('Payment verification failed: ' + (verifyData && (verifyData.message || JSON.stringify(verifyData)) || ''));
          }
        } catch (err) {
          console.error('verify error', err);
          alert('Verification failed. Please contact support.');
        }
      },
      // optional modal closed handler
      modal: {
        ondismiss: function() {
          // user closed the checkout dialog — you may suggest retry
          console.log('Checkout closed by user');
        }
      }
    };

    // If the server returned a mock order (dev mode), don't open the real
    // Razorpay widget (it will request keyless auth and be rejected). Instead
    // simulate a successful payment and call the verify endpoint.
    if (data && data.mock === true) {
      console.log('Mock order received; simulating payment flow for', orderId);
      const fakeResponse = {
        razorpay_order_id: orderId,
        razorpay_payment_id: `mockpay_${Date.now()}`,
        razorpay_signature: 'mock-signature'
      };
      try {
        // For mock flows also include shipping/deliveryAddress and userEmail
        const mockPayload = {
          ...fakeResponse,
          shipping,
          deliveryAddress,
          userEmail: customerInfo?.email || ''
        };
  const verifyRes = await fetch(BACKEND_HOST + '/api/payment/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(mockPayload)
        });
        const verifyData = await verifyRes.json();
        if (verifyData && verifyData.success) {
          navigate('/order-success', { state: { orderId } });
        } else {
          alert('Mock verification failed: ' + (verifyData && (verifyData.message || JSON.stringify(verifyData)) || ''));
        }
      } catch (err) {
        console.error('Mock verify error', err);
        alert('Verification failed. Please contact support.');
      }
      return;
    }

    // 3) open Razorpay
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <button onClick={handlePay} className="checkout-btn" aria-label={`Pay rupees ${amount}`}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M12 2v20M5 7h14M7 17h10" stroke="rgba(255,255,255,0.95)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      <span>Pay</span>
      <span className="price">₹{amount}</span>
    </button>
  );
};

export default CheckoutButton;
