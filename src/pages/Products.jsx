import React, { useState, useEffect } from "react"; 
import { Link } from "react-router-dom";
import { FaCartPlus, FaHeart } from 'react-icons/fa';
import ProductRating2 from './ProductRating2'; // Assuming rating component import
import "./Products.css"; // Styles for the grid and cards

// --- IMPORTANT: This component now accepts products via props ---
// Assuming this is used for the dedicated '/products' catalog view.
const ProductsCatalogPage = ({ products: initialProducts, onAdd, onWishlist }) => {
    
    // We keep state locally to handle sorting/filtering, based on the props received
    const [products, setProducts] = useState(initialProducts);
    
    // NOTE: Loading/Error state should be managed in the parent (App.jsx)
    // We assume initialProducts is the fully loaded array here.

    // --- Data Sync Effect ---
    // Update local product state whenever initialProducts changes (i.e., data loads in App.jsx)
    useEffect(() => {
        setProducts(initialProducts);
    }, [initialProducts]);


    // --- Handlers (Use the prop handlers) ---
    const handleAddToCart = (product) => {
        // Prevent default click propagation so Link doesn't redirect
        // The prop onAdd (which calls addToCart in App.jsx) handles state change
        onAdd(product); 
    };

    const handleAddToWishlist = (product) => {
        // The prop onWishlist (which calls handleWishlistToggle in App.jsx) handles state change
        onWishlist(product);
    };
    
    // --- Rendering Logic ---

    // Simple loading check (though App.jsx should prevent rendering if data isn't ready)
    if (!products || products.length === 0) {
        return (
            <div className="products-container">
                <h1>No Products Found.</h1>
                <p>Please add products via the Postman API.</p>
            </div>
        );
    }

    return (
        <div className="products-container">
            <h1>Product Catalog ({products.length})</h1>
            {/* TODO: Add Filtering/Sorting Controls here, which will update the local 'products' state */}
            
            <div className="products-grid">
                {products.map((product) => (
                    // --- In-App Navigation Fix ---
                    <Link 
                        // Use product.id (mapped from _id in App.jsx)
                        to={`/product/${product.id}`} 
                        state={{ product }} 
                        className="product-card-link" 
                        key={product.id} 
                        style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                        <div className="product-card">
                            {/* Wishlist Button - Ensure click stops propagation */}
                            <button 
                                className={`wishlist-icon-btn${product.isWishlisted ? ' wishlisted' : ''}`} 
                                onClick={e => { e.preventDefault(); handleAddToWishlist(product); }} // Prevent Link redirect
                            >
                                <FaHeart />
                            </button>
                            
                            {/* Image Display */}
                            {product.imageUrls && product.imageUrls.length > 0 ? (
                                <img src={product.imageUrls[0]} alt={product.name} />
                            ) : (
                                <div className="no-image-placeholder">No Image Available</div>
                            )}

                            <h2>{product.name}</h2>
                            <ProductRating2 avg={product.averageRating || 0} count={product.reviewCount || 0} />
                            
                            {/* Price Display */}
                            <p className="price">₹{product.discountedPrice || product.price}</p> 
                            
                            <p className="description">{product.description ? product.description.substring(0, 100) + '...' : ''}</p> 
                            
                            <div className="product-buttons">
                                {/* Add to Cart Button - Ensure click stops propagation */}
                                <button onClick={e => { e.preventDefault(); handleAddToCart(product); }}>
                                    Add to Cart
                                </button>
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Products; // Export with the new name