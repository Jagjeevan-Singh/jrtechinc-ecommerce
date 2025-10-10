import React, { useState } from "react";
import "./Wishlist.css";

const Wishlist = () => {
  // Demo wishlist items
  const [wishlistItems, setWishlistItems] = useState([
    { id: 1, name: "Microfiber Towel", price: 199 },
    { id: 2, name: "Hand Exercise Tool", price: 449 }
  ]);

  const handleRemove = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleMoveToCart = (item) => {
    alert(`${item.name} moved to cart!`);
    // TODO: connect to cart context or Firebase later
    handleRemove(item.id);
  };

  return (
    <div className="wishlist-container">
      <h1>Your Wishlist</h1>
      {wishlistItems.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div className="wishlist-grid">
          {wishlistItems.map((item) => (
            <div key={item.id} className="wishlist-card">
              <h3>{item.name}</h3>
              <p>₹{item.price}</p>
              <div className="wishlist-buttons">
                <button onClick={() => handleMoveToCart(item)}>Move to Cart</button>
                <button className="remove-btn" onClick={() => handleRemove(item.id)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Wishlist;
