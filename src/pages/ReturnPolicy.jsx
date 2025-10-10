import React from "react";
import "./ReturnPolicy.css";

const ReturnPolicy = () => {
  return (
    <div className="return-container">
      <h1>Return Policy</h1>
      <p>
        We want you to be fully satisfied with your purchase from JR Tech Inc. If 
        you are not happy with your product, please review our return policy below:
      </p>
      <ul>
        <li>Items can be returned within 7 days of delivery.</li>
        <li>Products must be in unused and original condition.</li>
        <li>Refunds will be processed within 5–7 business days after approval.</li>
        <li>Customer is responsible for return shipping costs unless product is defective.</li>
      </ul>
    </div>
  );
};

export default ReturnPolicy;
