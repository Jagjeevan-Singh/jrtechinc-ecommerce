// Vite: import all images in assets at build time
// NOTE: ProductImage component remains the same
function ProductImage({ src, alt, ...props }) {
    const images = import.meta.glob('../assets/*', { eager: true, as: 'url' });
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
import ProductRating2 from '../pages/ProductRating2'; // Corrected import path
import './ProductsPage.css';

// The component now relies entirely on the 'products' prop for its data source.
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
        // Use the MongoDB-generated _id (mapped to 'id' in App.jsx) for navigation
        navigate(`/product/${product.id}`, { state: { product } }); 
    };

    // Use the products array passed down from App.jsx (which contains live MongoDB data)
    const productsToFilter = Array.isArray(products) ? products : [];
    
    // Filter logic applied to the live data
    const filteredProducts = searchTerm.trim() === ''
        ? productsToFilter
        : productsToFilter.filter(product => {
            const name = product.name.toLowerCase();
            const lowerSearchTerm = searchTerm.trim().toLowerCase();
            return lowerSearchTerm
                .split(/\s+/)
                .some(word => word && name.includes(word));
        });
    
    // Helper function to get the primary image source
    const getPrimaryImage = (product) => {
        if (product.mainImage) return product.mainImage;
        if (product.imageUrls && product.imageUrls.length > 0) return product.imageUrls[0];
        return ''; 
    };

    return (
        <section className="products-page">
            <h2>All Products ({productsToFilter.length})</h2>
            <div className="product-grid">
                {/* --- Handle Loading, Error, and Empty States --- */}
                {productsToFilter.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', color: '#888', fontSize: '1.2rem', padding: '2rem', textAlign: 'center' }}>
                        No products available. Add a product via the Postman API!
                    </div>
                ) : (
                /* --- Render Live Products --- */
                filteredProducts.map((product) => (
                    <div
                        key={product.id} // Uses the mapped MongoDB _id
                        className="product-card"
                    >
                        {/* --- WISHILIST ICON BUTTON (Fixed) --- */}
                        <button
                            className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`}
                            // CRITICAL FIX: Stop propagation to prevent card navigation
                            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onWishlist(product); }}
                            aria-label="Add to wishlist"
                            style={{ position: 'absolute', top: 14, right: 14, background: 'none', border: 'none', zIndex: 3, cursor: 'pointer', padding: 4 }}
                        >
                            <FaHeart />
                        </button>
                        
                        <ProductImage
                            src={getPrimaryImage(product)} 
                            alt={product.name}
                            className="product-image"
                            onClick={() => handleProductClick(product)} // Click on image/text navigates
                        />
                        
                        <h3 onClick={() => handleProductClick(product)}>{product.name}</h3>
                        <ProductRating2 avg={product.averageRating || 0} count={product.reviewCount || 0} />
                        
                        <p className="price">
                            ₹{product.discountedPrice || product.price || 'N/A'} 
                            
                            {product.mrp && product.mrp > product.discountedPrice && (
                                <span className="original-price">₹{product.mrp}</span>
                            )}
                        </p>
                        <div className="product-actions">
                            {/* --- ADD TO CART BUTTON (Fixed) --- */}
                            <button 
                                // CRITICAL FIX: Stop propagation to prevent card navigation
                                onClick={(e) => { e.stopPropagation(); e.preventDefault(); onAdd(product); }}
                            >
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