import React from "react";
import "./Footer.css";

const Footer = () => (
  <footer className="main-footer">
    <div className="footer-content">
      <span className="footer-brand">JR Tech Inc &copy; {new Date().getFullYear()}</span>
      <span className="footer-links">
        <NavLink to="/terms">Terms</NavLink>
        <NavLink to="/privacy">Privacy</NavLink>
        <NavLink to="/return-policy">Return Policy</NavLink>
        <NavLink to="/shipping-policy">Shipping</NavLink>
      </span>
    </div>
  </footer>
);

export default Footer;
