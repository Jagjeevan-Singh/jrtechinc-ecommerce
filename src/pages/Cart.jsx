import React, { useState } from 'react';
// Import BrowserRouter for local component context, and replace useNavigate
import { useNavigate } from 'react-router-dom';
// The external CSS import is removed to resolve the build error. Styles are now inline.

// --- Helper Component: Product Rating (replaces ProductRating2) ---
const ProductRating = ({ avg = 0, count = 0 }) => {
    const fullStars = Math.floor(avg);
    const hasHalfStar = avg % 1 !== 0 && avg > 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    const StarIcon = ({ filled, half }) => (
        <span 
            role="img" 
            aria-label={half ? "half star" : filled ? "full star" : "empty star"}
            style={{ 
                color: filled || half ? '#ffc107' : '#e0e0e0', // Use a rich gold/grey for stars
                fontSize: '1em',
                lineHeight: '1',
            }}
        >
            {half ? '★' : filled ? '★' : '☆'}
        </span>
    );

    return (
        <div style={{ display: 'flex', alignItems: 'center' }}>
            {[...Array(fullStars)].map((_, i) => <StarIcon key={`full-${i}`} filled={true} />)}
            {hasHalfStar && <StarIcon half={true} />}
            {[...Array(emptyStars)].map((_, i) => <StarIcon key={`empty-${i}`} filled={false} />)}
            <span style={{ color: '#999', marginLeft: '8px', fontSize: '0.9em', fontWeight: 400 }}>({count})</span>
        </div>
    );
};

// --- Helper: Icon SVGs (replaces react-icons/fa) ---
const TrashIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" style={{ width: '1em', height: '1em', marginRight: '5px', verticalAlign: 'middle' }}>
        <path fill="currentColor" d="M135.2 17.7L128 32H32C14.3 32 0 46.3 0 64S14.3 96 32 96H416c17.7 0 32-14.3 32-32s-14.3-32-32-32H320l-7.2-14.3C307.4 6.8 296.3 0 284.2 0H163.8c-12.1 0-23.2 6.8-28.6 17.7zM416 128H32v320c0 35.3 28.7 64 64 64H352c35.3 0 64-28.7 64-64V128zm-80 64V432c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zM272 192V432c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16zM176 192V432c0 8.8-7.2 16-16 16s-16-7.2-16-16V192c0-8.8 7.2-16 16-16s16 7.2 16 16z"/>
    </svg>
);
const HeartIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" style={{ width: '1em', height: '1em', marginRight: '5px', verticalAlign: 'middle' }}>
        <path fill="currentColor" d="M47.6 300.4L208 460.8c6.6 6.6 15.6 9.8 24.6 9.8s18-3.2 24.6-9.8l160.4-160.4C416 268.8 448 226.2 448 178c0-52.6-39.6-96-90.8-96C312.2 82 278 107.6 256 142.4 234 107.6 199.8 82 154.8 82 103.6 82 64 125.4 64 178c0 48.2 32 90.8 78.4 117.6zM256 464c-12.8 0-25.6-5.4-34.6-14.4L47 300.4C18.2 284 0 249.2 0 207c0-68.8 54.8-128 123-128 41 0 77 19.8 102 53.4C239 123.8 256 153 256 153s17-29.2 31-48.6c25-33.6 61-53.4 102-53.4 68.2 0 123 59.2 123 128 0 42.2-18.2 77-46 93.4L290.6 449.6C281.6 458.6 268.8 464 256 464z"/>
    </svg>
);
const ImagePlaceholder = ({ alt, className, style, onClick }) => {
    const defaultStyle = {
        width: '100px',
        height: '100px',
        backgroundColor: '#e0e0e0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '0.8em',
        textAlign: 'center',
        border: '1px solid #c0c0c0',
        color: '#666',
    };
    return (
        <div 
            className={className} 
            style={{ ...defaultStyle, ...style }} 
            onClick={onClick}
            title={alt}
        >
            Product Image
        </div>
    );
};


// The core component
function Cart({ cartItems = [], onRemove, onUpdateQuantity, onMoveToWishlist, onApplyCoupon, coupon, setCoupon, couponError, discount = 0, subtotal, discountedTotal, onCheckout }) {
    const navigate = useNavigate();

    // Patch: Synthesize mainImage for items and ensure price/quantity are numeric
    const normalizedCartItems = cartItems.map(item => {
        let newItem = item;
        if (!item.mainImage && item.image) {
            newItem = {
                ...item,
                mainImage: item.image,
                brand: item.brand || 'Bold & Brew',
            };
        }
        
        const itemPrice = typeof newItem.price === 'number' ? newItem.price : parseFloat(newItem.price) || 0;
        const itemQuantity = typeof newItem.quantity === 'number' ? newItem.quantity : parseInt(newItem.quantity, 10) || 0;
        
        return {
            ...newItem,
            price: itemPrice,
            quantity: itemQuantity,
        };
    });

    // --- CORE CALCULATION: Ensures the totals reflect the cart items accurately ---
    const calculatedSubtotal = normalizedCartItems.reduce((acc, item) => {
        return acc + (item.price * item.quantity);
    }, 0);

    const calculatedDiscountedTotal = Math.max(0, calculatedSubtotal - discount);

    // Format the numbers for display (always show 2 decimal places)
    const subtotalDisplay = calculatedSubtotal.toFixed(2);
    const discountedTotalDisplay = calculatedDiscountedTotal.toFixed(2);
    // --- END CORE CALCULATION ---

    return (
        <div className="cart-container-wrapper">
            {/* Inline CSS restored to resolve compilation error */}
            <style jsx="true">{`
                /* Global Typography and Colors */
                .cart-container-wrapper {
                    min-height: 100vh;
                    background-color: #F8F8F8; /* Soft Off-White Background */
                    padding: 40px 20px;
                    font-family: 'Inter', sans-serif;
                }
                .cart-container-wrapper h2 {
                    font-size: 2.2em;
                    font-weight: 800;
                    color: #333333;
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 3px solid #E0E0E0;
                }

                /* Main Layout - Adaptive */
                .cart-page-pro {
                    display: flex;
                    gap: 32px;
                    max-width: 1280px;
                    margin: 0 auto;
                }
                .cart-pro-left {
                    flex: 3;
                    min-width: 0; /* Allows shrinking on mobile */
                }
                .cart-pro-right {
                    flex: 1;
                    min-width: 280px;
                }

                /* Mobile Layout */
                @media (max-width: 1024px) {
                    .cart-page-pro {
                        flex-direction: column;
                    }
                }
                @media (max-width: 600px) {
                    .cart-container-wrapper {
                        padding: 20px 10px;
                    }
                    .cart-container-wrapper h2 {
                        font-size: 1.8em;
                    }
                }

                /* Cart Item Styling */
                .cart-items-list-pro {
                    background-color: #FFFFFF;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    padding: 0 20px;
                }
                .cart-item-pro {
                    display: grid;
                    grid-template-columns: 100px 1fr;
                    gap: 20px;
                    padding: 20px 0;
                    border-bottom: 1px solid #F0F0F0;
                    align-items: center;
                }
                .cart-item-pro:last-child {
                    border-bottom: none;
                }
                .cart-item-img-pro {
                    width: 100%;
                    height: 100px;
                    object-fit: cover;
                    border-radius: 8px;
                    transition: transform 0.2s;
                }
                .cart-item-img-pro:hover {
                    transform: scale(1.02);
                }

                .cart-item-details-pro {
                    display: grid;
                    grid-template-columns: 2fr 1.5fr 1fr 1fr; /* Title | Price | Qty | Actions */
                    gap: 10px 20px;
                    align-items: center;
                }

                /* Responsive Cart Item Grid */
                @media (max-width: 850px) {
                    .cart-item-details-pro {
                        grid-template-columns: 1fr 1fr;
                        grid-template-areas: 
                            "title title"
                            "brand price"
                            "qty actions";
                    }
                    .cart-item-title-pro { grid-area: title; }
                    .cart-item-brand-pro { grid-area: brand; }
                    .cart-item-price-pro { grid-area: price; text-align: right; }
                    .cart-item-qty-pro { grid-area: qty; }
                    .cart-item-actions-pro { grid-area: actions; align-items: flex-end; }
                }

                @media (max-width: 500px) {
                    .cart-item-pro {
                        grid-template-columns: 70px 1fr;
                    }
                    .cart-item-img-pro { height: 70px; }
                    .cart-item-details-pro {
                        grid-template-columns: 1fr;
                        grid-template-areas: 
                            "title"
                            "brand"
                            "price"
                            "qty"
                            "actions";
                    }
                    .cart-item-price-pro { text-align: left; }
                    .cart-item-actions-pro { align-items: flex-start; }
                }

                /* Product Info Styling */
                .cart-item-title-pro {
                    font-weight: 700;
                    font-size: 1.1em;
                    color: #333333;
                    transition: color 0.15s;
                    cursor: pointer;
                }
                .cart-item-title-pro:hover {
                    color: #8C5230; /* Coffee hover accent */
                }
                .cart-item-brand-pro {
                    color: #999;
                    font-size: 0.85em;
                    font-style: italic;
                    text-transform: uppercase;
                }
                .cart-item-price-pro {
                    font-size: 1.1em;
                    font-weight: 600;
                    white-space: nowrap;
                    color: #333333;
                }
                .cart-item-price-pro > span:last-child { /* Original Price */
                    color: #B0B0B0;
                    margin-left: 10px;
                }
                .out-of-stock-badge {
                    background-color: #ffeded;
                    color: #d32f2f;
                    padding: 4px 10px;
                    border-radius: 4px;
                    font-size: 0.8em;
                    font-weight: 600;
                    width: fit-content;
                }
                
                /* Quantity Control */
                .cart-item-qty-pro {
                    display: flex;
                    align-items: center;
                    border: 1px solid #D0D0D0;
                    border-radius: 6px;
                    overflow: hidden;
                    width: fit-content;
                }
                .cart-item-qty-pro button {
                    background-color: #F8F8F8;
                    border: none;
                    padding: 8px 12px;
                    cursor: pointer;
                    font-weight: bold;
                    color: #333;
                    transition: background-color 0.2s, color 0.2s;
                }
                .cart-item-qty-pro button:hover:not(:disabled) {
                    background-color: #E0E0E0;
                }
                .cart-item-qty-pro button:disabled {
                    cursor: not-allowed;
                    opacity: 0.4;
                }
                .cart-item-qty-pro span {
                    padding: 0 15px;
                    font-size: 1em;
                    color: #333;
                }

                /* Action Buttons (Move/Remove) */
                .cart-item-actions-pro {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    align-items: flex-start;
                }
                .cart-item-actions-pro button {
                    display: flex;
                    align-items: center;
                    background: none;
                    border: none;
                    cursor: pointer;
                    font-size: 0.85em;
                    padding: 5px;
                    color: #999;
                    transition: color 0.2s, opacity 0.2s;
                    font-weight: 500;
                }
                .cart-item-actions-pro button:hover {
                    color: #8C5230;
                }
                .remove-item-pro {
                    color: #d32f2f !important;
                }
                .remove-item-pro:hover {
                    color: #b71c1c !important;
                }

                /* Order Summary */
                .cart-summary-box-pro {
                    background-color: #FFFFFF;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid #E0E0E0;
                    position: sticky;
                    top: 20px; /* Stick to the top when scrolling */
                }
                .cart-summary-box-pro h3 {
                    font-size: 1.4em;
                    font-weight: 700;
                    color: #333;
                    border-bottom: 1px solid #E0E0E0;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .cart-summary-row-pro {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 10px;
                    font-size: 1em;
                    color: #555;
                }
                .cart-summary-total-pro {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1.3em;
                    font-weight: 700;
                    color: #333;
                    padding-top: 15px;
                    border-top: 2px solid #D0D0D0;
                    margin-top: 15px;
                }
                .discount-value {
                    color: #388e3c; /* Green for discount */
                    font-weight: 600;
                }
                
                /* Coupon Input */
                .coupon-row-pro {
                    display: flex;
                    gap: 10px;
                    margin-top: 15px;
                    margin-bottom: 15px;
                    padding-top: 10px;
                    border-top: 1px dashed #E0E0E0;
                }
                .cart-coupon-input-pro {
                    flex-grow: 1;
                    padding: 10px 12px;
                    border: 1px solid #D0D0D0;
                    border-radius: 8px;
                    font-size: 1em;
                }
                .apply-coupon-btn-pro {
                    background-color: #8C5230; /* Rich coffee color */
                    color: white;
                    padding: 10px 15px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: 600;
                    transition: background-color 0.2s;
                }
                .apply-coupon-btn-pro:hover {
                    background-color: #4A3C35;
                }
                .cart-coupon-error-pro {
                    color: #d32f2f;
                    font-size: 0.9em;
                    margin-bottom: 10px;
                }
                
                /* Checkout Button */
                .checkout-btn-pro {
                    width: 100%;
                    background-color: #4A3C35; /* Deep Espresso */
                    color: white;
                    padding: 15px 0;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1em;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background-color 0.2s;
                    margin-top: 20px;
                    box-shadow: 0 4px 10px rgba(74, 60, 53, 0.3);
                }
                .checkout-btn-pro:hover:not(:disabled) {
                    background-color: #8C5230;
                }
                .checkout-btn-pro:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    box-shadow: none;
                }

                /* Visually Hidden Helper Class */
                .visually-hidden {
                    position: absolute;
                    width: 1px;
                    height: 1px;
                    margin: -1px;
                    padding: 0;
                    overflow: hidden;
                    clip: rect(0, 0, 0, 0);
                    border: 0;
                }
            `}</style>

            <div className="cart-page-pro">
                <div className="cart-pro-left">
                    <h2>Your Cart ({normalizedCartItems.length} {normalizedCartItems.length === 1 ? 'Item' : 'Items'})</h2>
                    {normalizedCartItems.length === 0 ? (
                        <div className="cart-empty-pro">Your cart is empty. Start adding some products!</div>
                    ) : (
                        <div className="cart-items-list-pro">
                            {normalizedCartItems.map((item) => {
                                const imageSrc = (item.imageUrls && item.imageUrls.length > 0) ? item.imageUrls[0] : (item.mainImage || item.image);
                                const outOfStock = item.stock === 0;
                                
                                return (
                                    <div className="cart-item-pro" key={item.id}>
                                        {/* Product Image/Placeholder */}
                                        {imageSrc ? (
                                            <img
                                                src={imageSrc}
                                                alt={item.name}
                                                className="cart-item-img-pro"
                                                style={{ cursor: 'pointer', opacity: outOfStock ? 0.6 : 1 }}
                                                onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                                                onError={(e) => e.target.src = "https://placehold.co/100x100/A0A0A0/ffffff?text=Product"}
                                            />
                                        ) : (
                                            <ImagePlaceholder
                                                alt={item.name}
                                                className="cart-item-img-pro"
                                                style={{ opacity: outOfStock ? 0.6 : 1 }}
                                                onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                                            />
                                        )}
                                        
                                        {/* --- PRODUCT DETAILS GRID --- */}
                                        <div className="cart-item-details-pro">
                                            
                                            {/* Item Name & Rating (Col 1) */}
                                            <div
                                                className="cart-item-title-pro"
                                                style={{ opacity: outOfStock ? 0.7 : 1 }}
                                                onClick={() => navigate(`/product/${item.id}`, { state: { product: item } })}
                                            >
                                                {item.name}
                                                <div className="product-rating-row">
                                                    <ProductRating avg={item.averageRating || 0} count={item.reviewCount || 0} />
                                                </div>
                                                <div className="cart-item-brand-pro" style={{marginTop: '5px'}}>{item.brand}</div>
                                                {outOfStock && <div className="out-of-stock-badge">Out of Stock</div>}
                                            </div>
                                            
                                            {/* Price (Col 2) */}
                                            <div className="cart-item-price-pro">
                                                <span style={{ fontWeight: 700, color: '#333', fontSize: '1.2em' }}>₹{item.price.toFixed(2)}</span>
                                                {item.originalPrice && item.originalPrice > item.price && (
                                                    <span style={{ textDecoration: 'line-through', color: '#B0B0B0', marginLeft: 8, fontSize: '0.9em' }}>
                                                        ₹{item.originalPrice}
                                                    </span>
                                                )}
                                            </div>

                                            {/* Quantity Control (Col 3) */}
                                            <div className="cart-item-qty-pro">
                                                <button 
                                                    // This calls the handler function provided by the parent (App)
                                                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} 
                                                    disabled={item.quantity <= 1 || outOfStock}
                                                    aria-label="Decrease quantity"
                                                >-</button>
                                                <span>{item.quantity}</span>
                                                <button 
                                                    // This calls the handler function provided by the parent (App)
                                                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} 
                                                    disabled={outOfStock}
                                                    aria-label="Increase quantity"
                                                >+</button>
                                            </div>
                                            
                                            {/* Actions (Col 4) */}
                                            <div className="cart-item-actions-pro">
                                                <button 
                                                    className="move-wishlist-pro" 
                                                    onClick={(e) => { e.stopPropagation(); onMoveToWishlist(item); }}
                                                    disabled={outOfStock} 
                                                    style={outOfStock ? {opacity:0.6, cursor:'not-allowed'} : {}}
                                                >
                                                    <HeartIcon /> Wishlist
                                                </button>
                                                <button 
                                                    className="remove-item-pro" 
                                                    // This calls the handler function provided by the parent (App)
                                                    onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                                                >
                                                    <TrashIcon /> Remove
                                                </button>
                                            </div>
                                            
                                        </div>
                                        {/* --- END PRODUCT DETAILS GRID --- */}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                
                {/* --- Right Section: Order Summary --- */}
                <div className="cart-pro-right">
                    <div className="cart-summary-box-pro">
                        <h3>Order Summary</h3>
                        <div className="cart-summary-row-pro">
                            <span>Subtotal</span>
                            <span>₹{subtotalDisplay}</span>
                        </div>
                        {discount > 0 && (
                            <div className="cart-summary-row-pro">
                                <span className="discount-value">Discount ({((discount/calculatedSubtotal)*100).toFixed(0)}%)</span>
                                <span className="discount-value">-₹{discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="cart-summary-row-pro">
                            <span>Shipping</span>
                            <span style={{fontWeight: 600, color: '#388e3c'}}>Free</span>
                        </div>
                        
                        {/* Coupon Input Row */}
                        <div className="coupon-row-pro">
                            <label htmlFor="cart-coupon" className="visually-hidden">Coupon code</label>
                            <input
                                id="cart-coupon"
                                name="coupon"
                                type="text"
                                placeholder="Coupon code"
                                value={coupon}
                                onChange={e => setCoupon(e.target.value)}
                                className="cart-coupon-input-pro"
                                autoComplete="off"
                            />
                            <button className="apply-coupon-btn-pro" onClick={onApplyCoupon}>Apply</button>
                        </div>
                        {couponError && <div className="cart-coupon-error-pro">{couponError}</div>}
                        
                        {/* Total */}
                        <div className="cart-summary-total-pro">
                            <span>Order Total</span>
                            <span>₹{discountedTotalDisplay}</span>
                        </div>

                        <button 
                            className="checkout-btn-pro" 
                            onClick={() => navigate('/checkout')}
                            disabled={cartItems.length === 0 || normalizedCartItems.some(item => item.stock === 0)}
                        >
                            Proceed to Checkout
                        </button>

                        {normalizedCartItems.some(item => item.stock === 0) && (
                            <div style={{color:'#d32f2f',fontWeight:600,marginTop:'15px',fontSize:'0.9em',textAlign:'center'}}>
                                Please remove out of stock products to proceed.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

const App = () => {
    // State to manage the cart
    const [cartItems, setCartItems] = useState(initialMockCart);
    const [coupon, setCoupon] = useState('');
    const [couponError, setCouponError] = useState(null);
    const [discount, setDiscount] = useState(0);

    // Handler for updating quantity (+/- buttons)
    const handleUpdateQuantity = (id, newQuantity) => {
        setCartItems(prevItems => prevItems.map(item => 
            item.id === id ? { ...item, quantity: Math.max(1, newQuantity) } : item
        ));
    };

    // Handler for removing an item from the cart
    const handleRemove = (id) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    // Handler for moving to wishlist (MOCK)
    const handleMoveToWishlist = (item) => {
        console.log(`Moved item ${item.name} to wishlist!`);
        handleRemove(item.id); // Remove from cart after moving
    };

    // Handler for applying coupon (MOCK)
    const handleApplyCoupon = () => {
        setCouponError(null);
        setDiscount(0);

        const lowerCaseCoupon = coupon.toLowerCase();
        if (lowerCaseCoupon === 'save10') {
            const calculatedSubtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
            const tenPercentDiscount = calculatedSubtotal * 0.10;
            setDiscount(tenPercentDiscount);
            setCouponError('Coupon SAVED10 applied successfully! (10% off)');
        } else if (lowerCaseCoupon === 'expired') {
            setCouponError('Coupon expired or invalid.');
        } else {
            setCouponError('Invalid coupon code.');
        }
    };

    // Handler for checkout (MOCK)
    const handleCheckout = () => {
        const outOfStockItems = cartItems.filter(item => item.stock === 0);
        if (outOfStockItems.length > 0) {
            console.error("Cannot checkout with out of stock items.");
            // The disabled state on the button handles this, but the console log is useful for debugging.
            return;
        }
        console.log(`Checking out with final total: ₹${(cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0) - discount).toFixed(2)}`);
        // In a real app, this would navigate to the checkout page.
        // navigate('/checkout'); 
    };

    // The Cart component now receives its necessary props from the App state and handlers
    return (
        <BrowserRouter>
            <Cart 
                cartItems={cartItems}
                onUpdateQuantity={handleUpdateQuantity}
                onRemove={handleRemove}
                onMoveToWishlist={handleMoveToWishlist}
                onApplyCoupon={handleApplyCoupon}
                onCheckout={handleCheckout}
                coupon={coupon}
                setCoupon={setCoupon}
                couponError={couponError}
                discount={discount}
                // subtotal and discountedTotal props are still accepted for compatibility but calculated internally in Cart for display
            />
        </BrowserRouter>
    );
};

export default Cart;
