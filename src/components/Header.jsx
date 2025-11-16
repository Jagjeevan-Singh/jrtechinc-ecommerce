import { NavLink, useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaUser, FaSearch, FaHeart } from 'react-icons/fa';
import { CircularText } from '../blocks/TextAnimations/CircularText/CircularText.jsx';
import './Header.css';
import { useState } from 'react';
import logo from '../assets/logoround.jpeg';
import SideBar from './SideBar';

// NOTE: Add currentUser prop to receive authentication state from App.jsx
function Header({ cartCount = 0, wishlistCount = 0, currentUser }) { 
  const [showSearch, setShowSearch] = useState(false);
  const [localSearch, setLocalSearch] = useState('');
  const navigate = useNavigate();

  // Determine the correct destination: /account (dashboard) or /login (auth page)
  const accountDestination = currentUser ? '/account' : '/login';

  const handleSearchClick = () => {
    setShowSearch(true);
  };

  const handleSearchBlur = () => {
    setShowSearch(false);
    setLocalSearch('');
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearch.trim()) {
      if (typeof window.setAppSearchTerm === 'function') {
        window.setAppSearchTerm(localSearch);
      }
      setShowSearch(false);
      setLocalSearch('');
      navigate('/products');
    }
  };
  
  return (
    <header className="header">
      <SideBar />
      
      {/* Left: Circular Text Logo */}
      <div className="nav-left">
        <NavLink to="/" className="circular-logo">
          <div className="circular-logo-wrapper">
            <img src={logo} alt="Bold & Brew Logo" className="center-logo" />
            <CircularText
              text="JR TECH INC * JR TECH INC * "
              onHover="goBonkers"
              spinDuration={12}
              className="circular-text"
            />
          </div>
        </NavLink>
      </div>
      
      {/* Right: Icons or Search */}
      <div className="nav-right">
        {!showSearch && (
          <button className="icon-navlink" onClick={handleSearchClick} aria-label="Search">
            <FaSearch />
          </button>
        )}
        {showSearch && (
          <div className="search-overlay">
            <form
              onSubmit={handleSearchSubmit}
              className="search-overlay-form"
              style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '12px', flexWrap: 'nowrap' }}
            >
              <label htmlFor="header-search" className="visually-hidden">Search</label>
              <input
                id="header-search"
                name="search"
                type="text"
                className="search-overlay-input"
                autoFocus
                placeholder="Search"
                value={localSearch}
                onChange={e => setLocalSearch(e.target.value)}
                style={{ flex: '1 1 auto', minWidth: 0 }}
                autoComplete="off"
              />
              <button type="submit" className="search-overlay-icon-btn" aria-label="Search" style={{ flex: '0 0 auto' }}>
                <FaSearch />
              </button>
              <button type="button" className="search-overlay-close" aria-label="Close search" onClick={() => setShowSearch(false)} style={{ flex: '0 0 auto' }}>
                &#10005;
              </button>
            </form>
          </div>
        )}
        
        <NavLink to="/wishlist" className="icon-navlink" aria-label="Wishlist">
          <FaHeart />
          {wishlistCount > 0 && <span className="badge">{wishlistCount}</span>}
        </NavLink>
        
        <NavLink to="/cart" className="icon-navlink" aria-label="Shopping Cart">
          <FaShoppingCart />
          {cartCount > 0 && <span className="badge">{cartCount}</span>}
        </NavLink>
        
        {/* --- THE FIX: Conditional Navigation --- */}
        <NavLink to={accountDestination} className="icon-navlink" aria-label="Account">
          <FaUser />
        </NavLink>
        {/* -------------------------------------- */}
      </div>
    </header>
  );
}

export default Header;