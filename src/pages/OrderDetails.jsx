import React, { useEffect, useState } from 'react';
const BACKEND_HOST = import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
import { useParams, useNavigate } from 'react-router-dom';
import './OrderSuccess.css';

// Small CancelButton component moved above the main component to avoid JSX parsing
function CancelButton({ orderId, onCancelled }) {
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this order? This action cannot be undone.')) return;
    setError(null);
    setLoading(true);
    try {
      // Try relative path then fallback to direct backend
      let res = null;
      try { res = await fetch(`/api/orders/${orderId}/cancel`, { method: 'POST' }); } catch(e) { res = null; }
      if (!res || !res.ok) {
        try { res = await fetch((import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com') + `/api/orders/${orderId}/cancel`, { method: 'POST' }); } catch(e) { res = res || null; }
      }
      if (!res) throw new Error('No response from server');
      const json = await res.json();
      if (!res.ok) throw new Error(json && (json.message || JSON.stringify(json)) || 'Server error');
      // Expect { message, order }
      if (json && json.order) {
        onCancelled(json.order);
        alert('Order cancelled successfully');
      } else {
        onCancelled(json.order || null);
      }
    } catch (e) {
      console.error('Cancel error', e);
      setError(e.message || 'Failed to cancel order');
      alert('Could not cancel order: ' + (e.message || 'Unknown'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button className="btn btn-danger" onClick={handleCancel} disabled={loading}>{loading ? 'Cancelling…' : 'Cancel Order'}</button>
      {error && <div style={{ color: 'red' }}>{error}</div>}
    </div>
  );
}

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);


  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      try {
        let res = null;
        // Try the relative API path first (works with Vite proxy).
        try {
          res = await fetch(`/api/orders/${id}`);
        } catch (e) {
          // network/proxy error when calling Vite dev server — will try direct backend next
          res = null;
        }

        // If relative fetch failed or returned a non-ok response, try direct backend host
        if (!res || !res.ok) {
            try {
            const direct = await fetch((import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com') + `/api/orders/${id}`);
            if (direct && direct.ok) {
              res = direct;
            } else {
              // if direct returned 404 we will attempt to synthesize from payment below
              res = direct || res;
            }
          } catch (e) {
            // ignore — we'll handle below
          }
        }

        let json = null;
        if (!res || !res.ok) {
          // If order endpoint returns 404 (common for mock orders), try
          // to fetch the Payment record and synthesize a minimal order
          // object so the UI can display details immediately.
          const status = res ? res.status : null;
          if (status === 404 || !res) {
            try {
              // Try debug payment via direct backend first
              let pRes = null;
              try { pRes = await fetch(`/api/debug/payment/${id}`); } catch(e) { pRes = null; }
              if ((!pRes || !pRes.ok)) {
                try { pRes = await fetch((import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com') + `/api/debug/payment/${id}`); } catch(e) { pRes = null; }
              }
              if (pRes && pRes.ok) {
                const pJson = await pRes.json();
                // Synthesize an order-like object from the payment record
                json = {
                  orderId: pJson.orderId,
                  _id: pJson._id || null,
                  items: pJson.items || [],
                  totalAmount: Number(pJson.amount) || 0,
                  shipping: pJson.shipping || null,
                  deliveryAddress: pJson.deliveryAddress || null,
                  paymentStatus: pJson.status || 'Paid',
                  paymentEvents: [{ timestamp: pJson.updatedAt || pJson.createdAt || Date.now(), status: 'Paid', details: 'Mock payment' }],
                  createdAt: pJson.createdAt || Date.now()
                };
              } else {
                throw new Error('Order not found');
              }
            } catch (e) {
              throw new Error('Order not found');
            }
          } else {
            throw new Error('Order not found');
          }
        } else {
          json = await res.json();
        }
        // If order has items with productId, fetch product details for each
        if (json.items && json.items.length > 0) {
          const augmented = await Promise.all(json.items.map(async (it) => {
                if (it.productId) {
              try {
                let pRes = null;
                try { pRes = await fetch(BACKEND_HOST + `/api/products/${it.productId}`); } catch(e) { pRes = null; }
                if (pRes && pRes.ok) {
                  const pJson = await pRes.json();
                  return { ...it, name: it.name || pJson.name, imageUrl: it.imageUrl || pJson.imageUrls?.[0] || pJson.imageUrl };
                }
              } catch (e) {
                // ignore per-item fetch error
              }
            }
            return it;
          }));
          json.items = augmented;
        }
        setOrder(json);
      } catch (e) {
        setError(e.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [id]);

  // If the order object lacks shipping, attempt to fetch Payment record
  // (some older orders stored shipping in the Payment record instead)
  useEffect(() => {
    const fetchPaymentShipping = async () => {
      if (!order || order.shipping || !order.orderId) return;
      try {
        const pRes = await fetch(`/api/debug/payment/${order.orderId}`);
        if (!pRes.ok) return;
        const pJson = await pRes.json();
        if (pJson && pJson.shipping) {
          setOrder(prev => ({ ...prev, shipping: pJson.shipping }));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchPaymentShipping();
  }, [order]);

  // Also try to pull the new deliveryAddress from the Payment record for
  // older orders that didn't have deliveryAddress on the Order document.
  useEffect(() => {
    const fetchPaymentDelivery = async () => {
      if (!order || order.deliveryAddress || !order.orderId) return;
      try {
        const pRes = await fetch(`/api/debug/payment/${order.orderId}`);
        if (!pRes.ok) return;
        const pJson = await pRes.json();
        if (pJson && pJson.deliveryAddress) {
          setOrder(prev => ({ ...prev, deliveryAddress: pJson.deliveryAddress }));
        }
      } catch (e) {
        // ignore
      }
    };
    fetchPaymentDelivery();
  }, [order]);

  

  if (loading) return <div style={{ padding: 24 }}>Loading order...</div>;
  if (error) return <div style={{ padding: 24, color: 'red' }}>{error}</div>;
  if (!order) return <div style={{ padding: 24 }}>Order not found.</div>;

  // Prefer explicit orderStatus (e.g. 'Cancelled', 'Shipped') when present
  const status = order.orderStatus || order.paymentStatus || order.status || 'Pending';
  const sLower = String(status || '').toLowerCase();
  const badgeClass = sLower.includes('paid') || sLower.includes('successful')
    ? 'badge-success'
    : (sLower.includes('cancel') || sLower.includes('fail'))
      ? 'badge-failed'
      : 'badge-pending';

  return (
    <div className="order-success-root">
      <div className="order-success-card" style={{ alignItems: 'flex-start' }}>
        <div className="order-success-content" style={{ padding: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h2 className="order-success-title">Order Details</h2>
              <div className="order-id-label">Order ID</div>
              <div className="order-id-value" style={{ fontSize: 16 }}>{order.orderId || order._id}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ marginBottom: 8 }}><span className={`badge ${badgeClass}`}>{status}</span></div>
              <div style={{ color: '#7a857b' }}>Placed: {new Date(order.createdAt).toLocaleString()}</div>
            </div>
          </div>

          <div className="order-details-grid">
            <div>
              <h3 style={{ marginBottom: 8 }}>Items</h3>
              {order.items && order.items.length > 0 ? (
                order.items.map((it, idx) => (
                  <div className="order-item" key={idx}>
                    <img src={it.imageUrl || `https://placehold.co/300x200?text=${encodeURIComponent(it.name || 'Item')}`} alt={it.name} />
                    <div className="order-item-info">
                      <div className="order-item-name">{it.name}</div>
                      <div className="order-item-meta">SKU: {it.variantSku || '—'} • Qty: {it.quantity} • ₹{(it.price||0).toFixed(2)}</div>
                      <div style={{ marginTop: 8 }} className="order-item-meta">{it.variantName ? `Variant: ${it.variantName}` : ''}</div>
                    </div>
                  </div>
                ))
              ) : (
                <p>No item details were stored for this order.</p>
              )}
            </div>

            <aside>
              <div className="order-details" style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="order-id-label">Delivery details</div>
                </div>
                {order.deliveryAddress ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700 }}>{order.deliveryAddress.fullName}</div>
                    <div style={{ color: '#6b6f6a', marginTop: 6 }}>{order.deliveryAddress.street}, {order.deliveryAddress.city}{order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''} - {order.deliveryAddress.postalCode}</div>
                    <div style={{ color: '#6b6f6a', marginTop: 6 }}>{order.deliveryAddress.phone}</div>
                  </div>
                ) : order.shipping ? (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontWeight: 700 }}>{order.shipping.name}</div>
                    <div style={{ color: '#6b6f6a', marginTop: 6 }}>{order.shipping.street}, {order.shipping.city} - {order.shipping.zip}</div>
                    <div style={{ color: '#6b6f6a', marginTop: 6 }}>{order.shipping.email}</div>
                  </div>
                ) : (
                  <div style={{ marginTop: 10, color: '#6b6f6a' }}>No delivery address stored for this order.</div>
                )}
              </div>

              <div className="order-details">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="order-id-label">Price details</div>
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="order-id-label">Listing price</div>
                    <div>—</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div className="order-id-label">Special price</div>
                    <div>₹{(order.totalAmount || 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                    <div className="order-id-label">Other discount</div>
                    <div style={{ color: '#0b8a3b' }}>—</div>
                  </div>
                  <div style={{ borderTop: '1px dashed #eee', marginTop: 10, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ fontWeight: 700 }}>Total amount</div>
                    <div style={{ fontWeight: 700 }}>₹{(order.totalAmount || 0).toFixed(2)}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div className="order-id-label">Payment method</div>
                    <div className="order-id-value">{order.paymentMethod || '—'}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <button className="btn btn-outline" onClick={() => alert('Download invoice not implemented in dev')}>Download Invoice</button>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: 16 }}>
                <h4 style={{ marginBottom: 8 }}>Payment Events</h4>
                <div className="payment-events">
                  {order.paymentEvents && order.paymentEvents.length > 0 ? (
                    order.paymentEvents.map((ev, i) => (
                      <div className="payment-event" key={i}>
                        <div className="event-time">{new Date(ev.timestamp).toLocaleString()}</div>
                        <div className="event-details">
                          <div style={{ fontWeight: 700 }}>{ev.status}</div>
                          <div style={{ color: '#6b6f6a' }}>{ev.details}</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="payment-event">
                      <div className="event-time">—</div>
                      <div className="event-details">No payment events recorded.</div>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </div>

          <div className="order-action-row">
            <div className="left-actions">
              <button className="btn btn-primary" onClick={() => navigate('/orders')} aria-label="Back to orders">← Back to Orders</button>
            </div>

            <div className="right-actions">
              {/* Cancel order button: only show when order not already cancelled/shipped/delivered */}
              {(!order.orderStatus || (order.orderStatus !== 'Cancelled' && order.orderStatus !== 'Shipped' && order.orderStatus !== 'Delivered')) && (
                <CancelButton orderId={order._id || order.orderId} onCancelled={(updatedOrder) => setOrder(updatedOrder)} />
              )}

              {/* optional download invoice placed in action row for consistent layout */}
              <button className="btn-outline-modern" onClick={() => alert('Download invoice not implemented in dev')}>Download Invoice</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
