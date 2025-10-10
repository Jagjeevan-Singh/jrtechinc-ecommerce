// Vite: import all images in assets at build time
const images = import.meta.glob('../assets/*', { eager: true, as: 'url' });

function ProductImage({ src, alt, ...props }) {
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} {...props} />;
    }
  }
  return <img src={src} alt={alt} {...props} />;
}

import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import ProductRating2 from './ProductRating2';
import './ProductsPage.css';

function ProductsPage({ products, onAdd, onWishlist, searchTerm = '', setSearchTerm }) {
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Only clear search term if navigating away from /products
  useEffect(() => {
    return () => {
      if (setSearchTerm && prevPathRef.current === '/products' && location.pathname !== '/products') {
        setSearchTerm('');
      }
    };
  }, [setSearchTerm, location.pathname]);

  const handleProductClick = (product) => {
    navigate(`/product/${product.id}`, { state: { product } });
  };

  // Split search term into words, filter products if any word matches product name
  // Use only the two provided products
  const defaultProducts = [
    {
      id: 1,
      name: "JR Ultimate Finger Exerciser & Hand Strengthener – Heavy Resistance Grip Ball for Men & Women – Finger Strength Trainer for Workout, Rehab, Stress Relief – Durable ABS Material (Multicolor, Heavier)",
      mrp: 999,
      price: 359,
      mainImage: 'hand-exercise.jpg',
      description: `🔥 Designed for Real Strength Training: The JR Ultimate Finger Exerciser Strength Trainer is engineered for serious finger and hand strengthening. Its ergonomic ball design ensures just the right amount of resistance to help build finger endurance, grip power, and hand flexibility without discomfort.\n\n🎯 Individually Adjustable Finger Tension: Featuring customized five-finger plungers, each finger can be trained individually. The adjustable tension system allows you to increase resistance per finger, making it perfect for progressive training. The silicone rubber pads provide a comfortable grip on both the palm and fingertips.\n\n💪 Improves Strength, Dexterity & Mobility: Ideal for those recovering from injury, dealing with arthritis, or simply wanting to enhance grip strength. The smooth, pain-free resistance makes it suitable for daily workouts and rehab therapy.\n\n⚙️ Heavy Resistance (Black Version) for Advanced Users: This black variant provides higher resistance—perfect for advanced users who need intense finger and grip workouts. Crafted from durable ABS material (Acrylonitrile Butadiene Styrene) to withstand daily usage.\n\n🎸 Versatile Use for Athletes, Musicians & Professionals: Whether you're a guitarist, pianist, rock climber, office worker, artist, or athlete, this hand strengthener helps enhance precision, stamina, and control. A perfect addition to your daily routine or physical therapy equipment.\n\n⚠️ IMPORTANT NOTE: This is not a toy or a light-use product. It’s designed for users who already have basic hand strength. If you lack strength or are looking for a soft grip exerciser, this is not recommended. To see real results, you must use it consistently and with dedication. Strength and stamina require effort—there are no shortcuts.`
    },
    {
      id: 2,
      name: "JR Micro Fiber Cloth for Car Cleaning - Ultra Absorbent Microfiber Cleaning Cloth - Soft & Scratch-Free Car Cleaning Clothes - Ideal Car Cleaning Accessories - Machine Washable",
      mrp: 499,
      price: 149,
      mainImage: 'microfiber-towel.jpg',
      description: `Superior Absorbency for Effortless Cleaning: Our micro fiber cloth for car cleaning offers exceptional absorption, soaking up spills and debris with ease, saving you time and effort during your car maintenance routine. Its ultra-soft texture ensures a scratch-free finish, enhancing your vehicle's appearance, making it the ideal choice for perfectionists who want their car to shine immaculately after each wash.\n\nDurable and Long-lasting Design: This microfiber cloth for car cleaning stands up to repeated uses and washes, maintaining its form and effectiveness. It remains an essential part of your car cleaning accessories, ensuring longevity and durability with each use. Reduce replacement costs and environmental impact by investing in a cloth built to last, meeting the demands of frequent car enthusiasts and professionals alike.\n\nTime-Saving Quick Dry Technology: Experience a hassle-free drying process with our car towel for cleaning, equipped with enhanced quick-drying properties. Speed up your cleaning routine without leaving a trail of lint or residue behind. Ideal for busy lifestyles, it is engineered to keep up with fast-paced schedules, ensuring your vehicle looks pristine in no time.\n\nMulti-Purpose Cleaning Efficiency: Not just limited to your car, this versatile microfiber cleaning cloth is perfect for a range of tasks—whether it's detailing the interior, cleaning windows for a streak-free finish, or polishing surfaces at home. Its adaptability ensures you get maximum utility, seamlessly fitting into your cleaning toolkit for all-around household effectiveness.\n\nGentle and Safe for All Surfaces: Our car cleaning clothes ensure even the most delicate surfaces of your vehicle are treated gently, preventing scratching or marring. Perfect for maintaining the integrity of your car's paint and interior surfaces, it caters to car owners who value quality and care, delivering unmatched cleaning performance for every inch of your car.`
    }
  ];
  const filteredProducts = searchTerm.trim() === ''
    ? defaultProducts
    : defaultProducts.filter(product => {
        const name = product.name.toLowerCase();
        return searchTerm
          .toLowerCase()
          .split(/\s+/)
          .some(word => word && name.includes(word));
      });

  return (
    <section className="products-page">
      <h2>All Products</h2>
      <div className="product-grid">
        {filteredProducts.length === 0 ? (
          <div style={{ gridColumn: '1/-1', color: '#b19d8e', fontSize: '1.2rem', padding: '2rem' }}>
            No products found.
          </div>
        ) : (
          filteredProducts.map((product) => (
            <div
              key={product.id}
              className="product-card"
            >
              <button
                className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`}
                onClick={() => onWishlist(product)}
                aria-label="Add to wishlist"
                style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', zIndex: 3, cursor: 'pointer', padding: 4 }}
              >
                <FaHeart />
              </button>
              <ProductImage
                src={product.mainImage}
                alt={product.name}
                className="product-image"
                onClick={() => handleProductClick(product)}
              />
              <h3 onClick={() => handleProductClick(product)}>{product.name}</h3>
              <ProductRating2 avg={0} count={0} />
              <p className="price">
                ₹{product.price}
                {product.originalPrice && (
                  <span className="original-price">₹{product.originalPrice}</span>
                )}
              </p>
              <div className="product-actions">
                <button onClick={() => onAdd(product)}>
                  <FaCartPlus /> Add to Cart
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

export default ProductsPage;
