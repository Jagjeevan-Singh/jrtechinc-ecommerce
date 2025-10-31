import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './SideBar.css';

function SideBar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Hamburger Button to Open Sidebar */}
      <button 
        className="sidebar-hamburger" 
        onClick={() => setOpen(true)}
        aria-label="Open navigation menu" // Added for accessibility
      >
        <FaBars size={28} />
      </button>
      
      {/* Overlay (Closes sidebar when clicked outside) */}
      <div 
        className={`sidebar-overlay${open ? ' open' : ''}`} 
        onClick={() => setOpen(false)} 
      />
      
      {/* Main Sidebar Navigation */}
      <nav className={`sidebar${open ? ' open' : ''}`}>
        
        {/* Close Button */}
        <button 
          className="sidebar-close" 
          onClick={() => setOpen(false)}
          aria-label="Close navigation menu" // Added for accessibility
        >
          <FaTimes size={28} />
        </button>
        
        <div className="sidebar-logo">JR TECH INC</div>
        
        {/* Navigation Links (All use standard SPA navigation) */}
        <ul className="sidebar-links">
          <li>
            <NavLink to="/" onClick={() => setOpen(false)}>
              Home
            </NavLink>
          </li>
          <li>
            <NavLink to="/products" onClick={() => setOpen(false)}>
              Products
            </NavLink>
          </li>
          <li>
            <NavLink to="/orders" onClick={() => setOpen(false)}>
              Orders
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" onClick={() => setOpen(false)}>
              About Us
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" onClick={() => setOpen(false)}>
              Contact Us
            </NavLink>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default SideBar;