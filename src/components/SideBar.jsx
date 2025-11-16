import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa';
import './SideBar.css';

function SideBar() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  // Helper to close sidebar and navigate. We also set location.hash as a
  // defensive fallback so HashRouter navigation works even if the router
  // isn't picking up the change in some dev proxy setups.
  const go = (path) => {
    setOpen(false);
    try { navigate(path); } catch (e) {}
    // Small timeout to allow the sidebar to close visually before hash change
    setTimeout(() => {
      try { window.location.hash = `#${path}`; } catch (e) {}
    }, 40);
  };

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
    {/* Add a component-specific class `mobile-nav` so our CSS can target this
      sidebar without colliding with other `.sidebar` selectors in the app. */}
    <nav className={`sidebar mobile-nav${open ? ' open' : ''}`}>
        
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
          {/* Use programmatic navigation to avoid HashRouter/link quirks and
              ensure the sidebar reliably closes before navigating. */}
          <li>
            <button className="sidebar-link-button" onClick={() => go('/')}>Home</button>
          </li>
          <li>
            {/* Navigate to products page in the same tab */}
            <button className="sidebar-link-button" onClick={() => go('/products-sidebar')}>
              Products
            </button>
          </li>
          <li>
            <button className="sidebar-link-button" onClick={() => go('/orders')}>Orders</button>
          </li>
          <li>
            <button className="sidebar-link-button" onClick={() => go('/about')}>About Us</button>
          </li>
          <li>
            <button className="sidebar-link-button" onClick={() => go('/contact')}>Contact Us</button>
          </li>
        </ul>
      </nav>
    </>
  );
}

export default SideBar;