import React, { useState } from "react";
import { Link } from "react-router-dom";
import "./Navbar.css";
import logoImg from "../assets/logoround.jpeg";
import { FaSearch, FaShoppingCart, FaHeart, FaUser } from "react-icons/fa";
import { FaTimes } from "react-icons/fa";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  return (
      <header className="navbar">
        <div className="navbar-container">
          {/* Hamburger Icon */}
          <div className="menu-icon" onClick={toggleMenu}>
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
            <span className={menuOpen ? "bar open" : "bar"}></span>
          </div>

          {/* Logo */}
          <Link to="/" className="logo">
            <img src={logoImg} alt="Logo" style={{ height: "40px", marginLeft: "10px" }} />
          </Link>

          {/* Navigation Links (only right-side links) */}
          <nav className="nav-links">
            <Link to="/search"><FaSearch style={{ verticalAlign: "middle" }} title="Search" /></Link>
            {/* Removed Cart, Wishlist, and Account icons */}
          </nav>

          {/* Sidebar for hamburger menu */}
          {menuOpen && (
            <div className="sidebar">
              <button className="close-btn" onClick={() => setMenuOpen(false)} aria-label="Close Sidebar">
                <FaTimes />
              </button>
              <Link to="/" onClick={() => setMenuOpen(false)}>Home</Link>
              <Link to="/products" onClick={() => setMenuOpen(false)}>Products</Link>
              <Link to="/orders" onClick={() => setMenuOpen(false)}>Orders</Link>
              <Link to="/about" onClick={() => setMenuOpen(false)}>About</Link>
              {/* No Cart, Wishlist, or Account links in sidebar */}
            </div>
          )}
        </div>
      </header>
  );
};

export default Navbar;
