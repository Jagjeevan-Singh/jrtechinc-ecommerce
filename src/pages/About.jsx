import React from "react";
import "./About.css";

const About = () => {
  return (
    <div className="about-container">
      <h1>About JR Tech Inc.</h1>
      <p>
        Welcome to <strong>JR Tech Inc.</strong>, your trusted destination for high-quality products and innovative solutions.
        Since our inception, we have been committed to delivering exceptional value, unmatched service, 
        and products that meet the needs of our customers across India.
      </p>

      <h2>Our Mission</h2>
      <p>
        To empower our customers with reliable, premium-quality products at affordable prices, 
        while maintaining transparency and trust in every transaction.
      </p>

      <h2>Why Choose Us?</h2>
      <ul>
        <li>✔ High-quality products</li>
        <li>✔ Affordable prices</li>
        <li>✔ Fast and secure delivery</li>
        <li>✔ Excellent customer support</li>
      </ul>
    </div>
  );
};

export default About;
