import React from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const orderId = state?.orderId || state?.razorpay_order_id || '—';

  return (
    <div className="order-success-root">
      <div className="order-success-card">
        <div className="order-success-illustration" aria-hidden>
          {/* Checkmark SVG */}
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <circle cx="12" cy="12" r="11" fill="white" opacity="0.06" />
            <path d="M6 12.5l3.2 3.2L18 7" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="order-success-content">
          <h2 className="order-success-title">Order Confirmed</h2>
          <p className="order-success-subtitle">Thank you — your payment was successful. We've sent a confirmation to your email (if provided) and started processing your order.</p>

          <div className="order-details">
            <div>
              <div className="order-id-label">Order number</div>
              <div className="order-id-value">{orderId}</div>
            </div>
            <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
              <div className="order-id-label">Status</div>
              <div className="order-id-value">Paid</div>
            </div>
          </div>

          <div className="order-success-actions">
            <button className="btn btn-primary" onClick={() => navigate('/')}>Continue shopping</button>
            <button className="btn btn-outline" onClick={() => navigate('/orders')}>View orders</button>
            {/* Direct link to the order details (works with Razorpay orderId or internal _id) */}
            <button className="btn btn-outline" onClick={() => {
              if (!orderId || orderId === '—') return alert('Order id not available yet');
              navigate(`/orders/${orderId}`);
            }}>View order details</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
