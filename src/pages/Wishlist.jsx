import React from "react";
import { Link } from "react-router-dom"; 
import { FaTrash, FaShoppingCart } from 'react-icons/fa'; 
import "./Wishlist.css";

// Assuming you have an imported rating component for display:
import ProductRating2 from './ProductRating2'; 

// The component relies solely on props from the parent (App.jsx)
const Wishlist = ({ items, onRemove, onMoveToCart }) => {
    
    // Use the items array passed down from App.jsx
    const wishlistItems = items; 

    return (
        <div className="wishlist-container">
            <h1>Your Wishlist ({wishlistItems.length} items)</h1>
            
            {(wishlistItems.length === 0) ? (
                <p className="empty-message">Your wishlist is empty. Start adding products!</p>
            ) : (
                <div className="wishlist-list">
                    {wishlistItems.map((item) => {
                        // Defensive Price Check
                        const rawPrice = item.discountedPrice || item.price || item.mrp || 0;
                        const displayPrice = rawPrice ? rawPrice.toFixed(2) : 'N/A';
                        
                        // Determine the image source safely
                        const imgSrc = (item.imageUrls && item.imageUrls[0]) || item.mainImage || 'placeholder.jpg';
                        
                        return (
                            <div key={item.id} className="wishlist-item">
                                
                                {/* 1. Image and Title Link (Left Column) */}
                                <Link to={`/product/${item.id}`} className="item-link">
                                    <div className="item-image-wrapper">
                                        <img src={imgSrc} alt={item.name} className="item-image" />
                                    </div>
                                    <div className="item-details">
                                        <h3 className="item-title">{item.name}</h3>
                                        
                                        {/* FIX: Render the rating component directly without extra wrapper div */}
                                        {/* NOTE: We assume ProductRating2 renders the stars AND the count/average */}
                                        <ProductRating2 
                                            avg={item.averageRating || 0} 
                                            count={item.reviewCount || 0} 
                                        />
                                        
                                        {/* If ProductRating2 only shows stars, uncomment this line: */}
                                        {/* <span className="review-count">({item.reviewCount || 0})</span> */}

                                        <p className="item-price">₹{displayPrice}</p>
                                    </div>
                                </Link>

                                {/* 2. Action Buttons (Right Column) */}
                                <div className="item-actions">
                                    {/* Move to Cart Button */}
                                    <button 
                                        className="btn move-to-cart-btn" 
                                        onClick={() => (onMoveToCart || (() => {}))(item)}
                                    >
                                        <FaShoppingCart /> Move to Cart
                                    </button>
                                    
                                    {/* Remove Button */}
                                    <button 
                                        className="btn remove-btn" 
                                        onClick={() => (onRemove || (() => {}))(item.id)}
                                    >
                                        <FaTrash /> Remove
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Wishlist;