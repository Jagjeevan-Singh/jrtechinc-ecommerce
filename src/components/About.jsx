import React from 'react';
import './About.css';

import logo from '../assets/logo.jpeg';

const About = () => {
  return (
    <div className="about-container coffee-theme-bg">
      <div className="about-header">
        <img src={logo} alt="JR Tech Inc Logo" className="about-logo" />
        <h1 className="about-title">About <span className="coffee-highlight">JR TECH INC</span></h1>
      </div>
      <div className="about-main-content">
        <div className="about-story-card">
          <p className="about-description">
            Welcome to <b>JR Tech Inc</b> — your trusted <span className="coffee-highlight">wholesaler and importer of high-quality Chinese goods</span> in India.<br /><br />
            We specialize in sourcing and delivering a wide range of products directly from top manufacturers in China, ensuring the best value and reliability for our customers.
          </p>
          <blockquote className="about-quote">“Empowering your business with quality imports.”</blockquote>
        </div>
        <div className="about-values-section">
          <h2 className="values-title">Why Choose JR Tech Inc?</h2>
          <div className="values-list">
            <div className="value-card">
              <h3>Quality Assurance</h3>
              <p>We handpick products from reputable Chinese suppliers, ensuring every item meets strict quality standards before it reaches you.</p>
            </div>
            <div className="value-card">
              <h3>Wide Product Range</h3>
              <p>From electronics to lifestyle goods, we offer a diverse catalog to meet the needs of retailers, resellers, and businesses of all sizes.</p>
            </div>
            <div className="value-card">
              <h3>Competitive Pricing</h3>
              <p>Our direct relationships with manufacturers allow us to offer the best prices in the market, maximizing your profit margins.</p>
            </div>
            <div className="value-card">
              <h3>Reliable Logistics</h3>
              <p>We ensure timely delivery and safe handling of your orders, with transparent tracking and dedicated support.</p>
            </div>
            <div className="value-card">
              <h3>Customer Satisfaction</h3>
              <p>Our team is committed to providing excellent service, from inquiry to after-sales support, making your import experience smooth and hassle-free.</p>
            </div>
          </div>
        </div>
        <div className="about-signature-section">
          <p className="about-signature">Thank you for choosing <span className="coffee-highlight">JR Tech Inc</span> — your partner for <b>quality, value, and trust</b> in Chinese imports.</p>
        </div>
      </div>
    </div>
  );
};

export default About;
