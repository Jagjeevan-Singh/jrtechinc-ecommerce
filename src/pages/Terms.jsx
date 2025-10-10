import React from "react";
import "./Terms.css";

const Terms = () => {
  return (
    <div className="terms-container">
      <h1>Terms & Conditions</h1>
      <p>
        Welcome to JR Tech Inc. By accessing or using our website, you agree to comply 
        with and be bound by the following terms and conditions.
      </p>
      <ul>
        <li>All products listed are subject to availability.</li>
        <li>Prices and offers are subject to change without notice.</li>
        <li>Unauthorized use of this website may give rise to a claim for damages.</li>
        <li>All content is owned by JR Tech Inc. and may not be reproduced.</li>
      </ul>
    </div>
  );
};

export default Terms;
