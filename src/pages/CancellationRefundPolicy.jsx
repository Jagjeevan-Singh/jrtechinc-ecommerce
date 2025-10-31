import React from 'react';
import './PolicyPages.css';

const CancellationRefundPolicy = () => (
  <div className="policy-page-bg">
    <div className="policy-page-container">
      <h1>Cancellation & Refund Policy</h1>

      <div className="policy-blocks">

        <div className="policy-block">
          <div className="policy-block-number">1</div>
          <div className="policy-block-content">
            <h2>Introduction</h2>
            <p>
              At <b>JR Tech Inc.</b>, we are committed to providing quality products and a smooth shopping experience.
              This Cancellation & Refund Policy outlines the conditions for cancellations and refunds in accordance with Razorpay payment policies.
            </p>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">2</div>
          <div className="policy-block-content">
            <h2>Payment Processing</h2>
            <p>
              All payments made on our website are processed securely via <b>Razorpay</b>.
              We do not store or have access to your card, UPI, or bank details at any stage.
            </p>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">3</div>
          <div className="policy-block-content">
            <h2>Order Cancellation Policy</h2>
            <ul>
              <li>Orders can be cancelled within <b>24 hours</b> of placing the order.</li>
              <li>If the order has already been processed or shipped, cancellation cannot be processed.</li>
              <li>To request cancellation, please contact us at <b>jrtechinc21@gmail.com</b> or <b>8527914649</b> with your order details.</li>
            </ul>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">4</div>
          <div className="policy-block-content">
            <h2>Refund Eligibility</h2>
            <ul>
              <li>Refunds may be issued if:
                <ul>
                  <li>The cancellation request was submitted within the allowed time</li>
                  <li>The product delivered was damaged, defective, or incorrect</li>
                  <li>A paid service was not delivered as promised</li>
                </ul>
              </li>
              <li>Refunds will <b>not</b> be issued for:
                <ul>
                  <li>Change of mind after order processing</li>
                  <li>Damage caused by misuse</li>
                  <li>Digital services already delivered</li>
                </ul>
              </li>
            </ul>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">5</div>
          <div className="policy-block-content">
            <h2>Refund Process & Timeline</h2>
            <ul>
              <li>Approved refunds will be processed to the original payment method.</li>
              <li>Refund processing time: <b>5-7 Business Days</b>.</li>
              <li>Bank processing time (after refund is issued): <b>Additional 3-7 Business Days</b>.</li>
            </ul>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">6</div>
          <div className="policy-block-content">
            <h2>No Refund for Delivered Products</h2>
            <p>
              Once the product has been delivered and accepted by the customer, no refund will be provided unless the item is defective, damaged, or incorrect.
            </p>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">7</div>
          <div className="policy-block-content">
            <h2>Policy Updates</h2>
            <p>
              JR Tech Inc. reserves the right to update this policy at any time. Changes will be posted on this page with an updated effective date.
            </p>
          </div>
        </div>

        <div className="policy-block">
          <div className="policy-block-number">8</div>
          <div className="policy-block-content">
            <h2>Contact Us</h2>
            <p>
              For cancellation or refund inquiries, please contact us:<br/>
              <b>Email:</b> <a href="mailto:jrtechinc21@gmail.com">jrtechinc21@gmail.com</a><br/>
              <b>Phone:</b> 8527914649<br/>
              <b>Business Name:</b> JR Tech Inc.
            </p>
          </div>
        </div>

      </div>
    </div>
  </div>
);

export default CancellationRefundPolicy;
