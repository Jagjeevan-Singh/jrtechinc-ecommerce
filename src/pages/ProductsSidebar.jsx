import React, { useEffect, useState } from 'react';
import './ProductsSidebar.css';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaHeart } from 'react-icons/fa';

const BACKEND_HOST = import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
const API = '/api/products';

export default function ProductsSidebar({ onAdd, onWishlist, wishlistItems = [] }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortMode, setSortMode] = useState('relevance');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [priceSliderMax, setPriceSliderMax] = useState(20000);
  const [priceSliderTouched, setPriceSliderTouched] = useState(false);
  const [selectedRating, setSelectedRating] = useState(null);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());

  // Sync incoming wishlistItems (from App) into local Set for display
  useEffect(() => {
    try {
      const s = new Set((wishlistItems || []).map(i => i.id || i._id || ''));
      setWishlistedIds(s);
    } catch (e) {
      // ignore
    }
  }, [wishlistItems]);

  useEffect(() => {
    let cancelled = false;
    async function fetchProducts() {
      setLoading(true);
      setError(null);
      try {
        let res;
    try { res = await fetch(API); } catch (e) { res = await fetch((import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com') + API); }
        if (!res.ok) throw new Error('Failed to fetch products: ' + res.status);
        const data = await res.json();
  if (!cancelled) setProducts(data || []);
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchProducts();
    return () => { cancelled = true; };
  }, []);

  // Derived list after applying category filter and sort
  const displayed = React.useMemo(() => {
    let list = Array.isArray(products) ? products.slice() : [];

    // Filter by selected categories (if any)
    if (selectedCategories && selectedCategories.length) {
      list = list.filter(p => {
        const cat = p.category || p.categories || '';
        const cats = Array.isArray(cat)
          ? cat.map(s => String(s || '').trim().toLowerCase())
          : String(cat).split(',').map(s => s.trim().toLowerCase());
        return selectedCategories.some(sc => cats.includes(String(sc).trim().toLowerCase()));
      });
    }

    // Price filtering (min/max). Use manual inputs if provided; otherwise use slider only if touched
    const min = (priceMin !== '' && !isNaN(Number(priceMin))) ? Number(priceMin) : null;
    const max = (priceMax !== '' && !isNaN(Number(priceMax))) ? Number(priceMax) : (priceSliderTouched ? Number(priceSliderMax) : null);
    if (min !== null || max !== null) {
      list = list.filter(p => {
        const price = Number(p.discountedPrice || p.mrp || p.price || 0);
        if (min !== null && price < min) return false;
        if (max !== null && price > max) return false;
        return true;
      });
    }

    // Ratings filter (>= selectedRating)
    if (selectedRating) {
      list = list.filter(p => {
        const r = Number(p.rating || p.avgRating || p.averageRating || p.ratingAvg || 0);
        return r >= selectedRating;
      });
    }

    // Sorting
    if (sortMode === 'price-asc') {
      list.sort((a,b) => (a.discountedPrice||a.mrp||a.price||0) - (b.discountedPrice||b.mrp||b.price||0));
    } else if (sortMode === 'price-desc') {
      list.sort((a,b) => (b.discountedPrice||b.mrp||b.price||0) - (a.discountedPrice||a.mrp||a.price||0));
    } else if (sortMode === 'discount-desc') {
      const discount = p => {
        const mrp = p.mrp || p.discountedPrice || 0;
        const dp = p.discountedPrice || p.mrp || 0;
        if (!mrp) return 0;
        return ((mrp - dp) / (mrp || 1)) * 100;
      };
      list.sort((a,b) => discount(b) - discount(a));
    } else if (sortMode === 'newest') {
      list.sort((a,b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    }

    return list;
  }, [products, selectedCategories, sortMode, priceMin, priceMax, priceSliderMax, priceSliderTouched, selectedRating]);


  // Reusable filter block so desktop and mobile overlay share the same UI
  const filtersBlock = (
    <div className="ps-filter-box">
      <div className="ps-filter-header">
        <h2>Filter</h2>
      </div>

      <h3>Categories</h3>
      <div className="ps-cats-vertical">
        {[
          'Home & Kitchen',
          'Sports & Fitness',
          'Electronics',
          'Bags, Wallets & Luggage',
          'Car & Motorbike',
          'Computer & Accessories'
        ].map(cat => {
          const checked = selectedCategories.includes(cat);
          return (
            <label className={`ps-cat-line ${checked ? 'active' : ''}`} key={cat}>
              <input
                type="checkbox"
                checked={checked}
                onChange={() => setSelectedCategories(prev => prev.includes(cat) ? prev.filter(x => x !== cat) : [...prev, cat])}
              />
              <span className="ps-cat-name">{cat}</span>
            </label>
          );
        })}
      </div>

      <h3>Price</h3>
      <div className="ps-price-slider">
        <input type="range" min="0" max="20000" step="50" value={priceSliderMax} onChange={e => { setPriceSliderMax(Number(e.target.value)); setPriceMax(String(e.target.value)); setPriceSliderTouched(true); }} />
        <div className="ps-price-row">
          <input placeholder="Min" value={priceMin} onChange={e => setPriceMin(e.target.value)} />
          <input placeholder="Max" value={priceMax} onChange={e => setPriceMax(e.target.value)} />
        </div>
        <div className="ps-price-note">Tip: drag the slider or enter values manually</div>
      </div>

      <h3>Ratings</h3>
      <div className="ps-ratings">
        {[5,4,3].map(r => (
          <label key={r} className={`ps-rating-line ${selectedRating === r ? 'active' : ''}`}>
            <input type="radio" name="rating" checked={selectedRating === r} onChange={() => setSelectedRating(r)} />
            <span className="ps-rating-stars">{Array.from({length:r}).map((_,i) => <FaStar key={i} className="star" />)}{r < 5 ? <span className="and-above"> &amp; above</span> : ''}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="ps-root">
      <header className="ps-header">
        <div className="ps-header-actions">
          <button className="ps-filter-trigger" onClick={() => setShowMobileFilters(true)}>Filter</button>
        </div>
      </header>

      <div className="ps-content">
        <aside className="ps-filters">
          {filtersBlock}
        </aside>

        {showMobileFilters && (
          <div className="ps-mobile-filters-overlay" onClick={() => setShowMobileFilters(false)}>
            <div className="ps-mobile-filters" onClick={(e) => e.stopPropagation()}>
              {filtersBlock}
              <div className="ps-apply-bar">
                <button className="ps-apply-btn" onClick={() => setShowMobileFilters(false)}>Apply</button>
                <button className="ps-clear-btn" onClick={() => { setSelectedCategories([]); setPriceMin(''); setPriceMax(''); setPriceSliderTouched(false); setSelectedRating(null); }}>Clear</button>
              </div>
            </div>
          </div>
        )}

        <main className="ps-main">
          {loading && <div className="ps-loading">Loading products…</div>}
          {error && <div className="ps-error">Error: {error}</div>}

          {!loading && !error && (
            <>
              <div className="ps-controls">
                <div className="ps-results-count">{displayed.length} products</div>
                <div className="ps-sort">
                  <label>Sort:</label>
                  <select value={sortMode} onChange={e => setSortMode(e.target.value)}>
                    <option value="relevance">Relevance</option>
                    <option value="price-asc">Price — Low to High</option>
                    <option value="price-desc">Price — High to Low</option>
                    <option value="discount-desc">Discount — High to Low</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>

              <div className="ps-grid">
              {displayed.map(p => {
                const mrp = Number(p.mrp || 0);
                const dp = Number(p.discountedPrice || p.price || mrp || 0);
                const pct = mrp && mrp > dp ? Math.round(((mrp - dp) / mrp) * 100) : 0;
                const isWish = wishlistedIds.has(p._id);
                return (
                <article key={p._id} className="ps-card" onClick={() => navigate(`/product/${p._id}`, { state: { product: p } })}>
                  <div className="ps-image-wrap">
                    <img src={p.imageUrls && p.imageUrls.length ? p.imageUrls[0] : '/placeholder.jpg'} alt={p.name} />
                    <button
                      className={`ps-wishlist-btn ${isWish ? 'wishlisted' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation(); e.preventDefault();
                        // Optimistic local toggle
                        setWishlistedIds(prev => { const s = new Set(prev); if (s.has(p._id)) s.delete(p._id); else s.add(p._id); return s; });
                        // Notify parent to persist wishlist change (pass product with `id` so App handler recognizes it)
                        try { if (typeof onWishlist === 'function') onWishlist({ ...(p || {}), id: p._id }); } catch (err) {}
                      }}
                      aria-label={isWish ? 'Remove from wishlist' : 'Add to wishlist'}
                    >
                      <FaHeart />
                    </button>
                  </div>
                  <div className="ps-card-body">
                    <div className="ps-card-title">{p.name}</div>
                    <div className="ps-card-meta">{p.variants && p.variants[0] && p.variants[0].variantName ? p.variants[0].variantName : ''}</div>
                    <div className="ps-price">
                      {mrp && mrp > dp ? (
                        <>
                          <span className="ps-price-discount">₹{dp}</span>
                          <span className="ps-price-original">₹{mrp}</span>
                          {pct > 0 && <span className="ps-discount-pct">-{pct}%</span>}
                        </>
                      ) : (
                        <span className="ps-price-discount">₹{dp}</span>
                      )}
                    </div>
                    {/* Add to cart button below prices */}
                    <div className="ps-actions">
                      <button
                        className="ps-add-to-cart"
                        onClick={(e) => { e.stopPropagation(); e.preventDefault(); if (typeof onAdd === 'function') onAdd({ id: p._id, discountedPrice: dp, price: p.price, quantity: 1 }); }}
                      >
                        Add to cart
                      </button>
                    </div>
                  </div>
                </article>
                );
              })}
        </div>
        </>
      )}
        </main>
      </div>
    </div>
  );
}
