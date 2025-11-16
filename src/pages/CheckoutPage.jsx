import React, { useState, useMemo } from 'react';
import { useNavigate } from "react-router-dom";
import CheckoutButton from "../components/CheckoutButton";

{/* <CheckoutButton amount={orderTotal} customer={userDetails} /> */}

// The CheckoutPage component handles the address form and final order summary display.
function CheckoutPage({ 
    onBackToCart, 
    onProceedToPayment, 
    cartItems = [] 
}) { 
    const navigate = useNavigate();
    const orderTotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // ✅ Auto-calculate subtotal & total, replacing the previous fixed finalTotal
    const finalTotal = useMemo(() => {
        const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
        const discount = 0; // Keep discount 0 unless coupon logic added later
        const discountedTotal = subtotal - discount;
        return {
            subtotalDisplay: subtotal.toFixed(2),
            discountedTotalDisplay: discountedTotal.toFixed(2),
            discount
        };
    }, [cartItems]);
    // State for form fields
    const [formData, setFormData] = useState({
        fullName: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        phone: '',
        saveAddress: true,
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Handles input changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
        }));
        // Clear error immediately on change
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    // Validates form fields before submission
    const validateForm = () => {
        const newErrors = {};
        if (!formData.fullName) newErrors.fullName = 'Full Name is required.';
        if (!formData.addressLine1) newErrors.addressLine1 = 'Address Line 1 is required.';
        if (!formData.city) newErrors.city = 'City is required.';
        if (!formData.state) newErrors.state = 'State is required.';
        if (!/^\d{6}$/.test(formData.zip)) newErrors.zip = 'Zip Code must be 6 digits.';
        if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Valid Email is required.';
        if (!/^\d{10}$/.test(formData.phone)) newErrors.phone = 'Phone Number must be 10 digits.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handles form submission and triggers payment flow
    const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
        setIsSubmitting(false);
        // Do NOT navigate anywhere
        // CheckoutButton will trigger Razorpay popup
    }
    };

    
    // Calculate summary details
    const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

    return (
        <div className="checkout-container-page">
            <style jsx="true">{`
                /* Global Typography and Base Styling */
                .checkout-container-page {
                    min-height: 100vh;
                    background-color: #fcfcfc; /* Very light background */
                    padding: 40px 20px;
                    font-family: 'Inter', sans-serif;
                    color: #333;
                }
                
                /* Main Content Grid */
                .checkout-content {
                    max-width: 1200px;
                    margin: 0 auto;
                    display: grid;
                    grid-template-columns: 2fr 1fr;
                    gap: 40px;
                }
                
                /* Header */
                .checkout-header {
                    grid-column: 1 / -1;
                    font-size: 2.2em;
                    font-weight: 800;
                    color: #4A3C35; /* Deep Espresso Header Color */
                    margin-bottom: 30px;
                    border-bottom: 3px solid #E0E0E0;
                    padding-bottom: 15px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .back-to-cart {
                    background: none;
                    border: none;
                    color: #8C5230; /* Coffee Accent */
                    font-size: 1em;
                    font-weight: 600;
                    cursor: pointer;
                    transition: color 0.2s;
                    display: flex;
                    align-items: center;
                    padding: 8px 10px;
                    border-radius: 6px;
                }
                .back-to-cart:hover {
                    color: #4A3C35;
                    background-color: #f5f5f5;
                }

                /* Address Form Section */
                .address-form-section {
                    background-color: #FFFFFF;
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08); /* More pronounced shadow */
                    height: fit-content;
                }
                .address-form-section h3 {
                    font-size: 1.6em;
                    color: #4A3C35;
                    margin-bottom: 25px;
                    font-weight: 700;
                }
                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                }
                .full-width {
                    grid-column: 1 / -1;
                }
                .form-group label {
                    display: block;
                    margin-bottom: 5px;
                    font-weight: 600;
                    color: #555;
                    font-size: 0.95em;
                }
                .form-group input {
                    width: 100%;
                    padding: 12px;
                    border: 1px solid #D0D0D0;
                    border-radius: 8px;
                    font-size: 1em;
                    box-sizing: border-box;
                    transition: border-color 0.2s, box-shadow 0.2s;
                }
                .form-group input:focus {
                    border-color: #8C5230;
                    box-shadow: 0 0 0 3px rgba(140, 82, 48, 0.2);
                    outline: none;
                }
                .error-message {
                    color: #d32f2f;
                    font-size: 0.85em;
                    margin-top: 5px;
                    font-weight: 500;
                }
                /* Input error state */
                .form-group input:has(+.error-message) {
                    border-color: #d32f2f;
                }

                /* Checkbox Style */
                .checkbox-group {
                    display: flex;
                    align-items: center;
                    margin-top: 10px;
                    grid-column: 1 / -1;
                }
                .checkbox-group input[type="checkbox"] {
                    width: 16px;
                    height: 16px;
                    margin-right: 10px;
                    accent-color: #8C5230; /* Color the checkbox */
                    cursor: pointer;
                }
                .checkbox-group label {
                    font-weight: 400;
                    font-size: 1em;
                    color: #4A3C35;
                    margin-bottom: 0;
                }

                /* Order Summary (Right Column) */
                .order-summary-section {
                    background-color: #FFF8F4; /* Light Accent Color */
                    padding: 30px;
                    border-radius: 12px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
                    border: 1px solid #E0E0E0;
                    height: fit-content;
                    position: sticky;
                    top: 20px;
                }
                .order-summary-section h3 {
                    font-size: 1.4em;
                    color: #4A3C35;
                    border-bottom: 1px solid #D0D0D0;
                    padding-bottom: 15px;
                    margin-bottom: 15px;
                }
                .summary-items {
                    margin-bottom: 20px;
                    padding-bottom: 15px;
                    border-bottom: 1px dashed #E0E0E0;
                }
                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    margin-bottom: 8px;
                    font-size: 0.95em;
                    color: #555;
                }
                .summary-total {
                    display: flex;
                    justify-content: space-between;
                    font-size: 1.4em;
                    font-weight: 800;
                    color: #4A3C35;
                    padding-top: 15px;
                    border-top: 2px solid #8C5230; /* Bold total divider */
                    margin-top: 15px;
                }
                /* Payment Button */
                .proceed-payment-btn {
                    width: 100%;
                    background-color: #8C5230; 
                    color: white;
                    padding: 15px 0;
                    border: none;
                    border-radius: 8px;
                    font-size: 1.1em;
                    font-weight: 700;
                    cursor: pointer;
                    transition: background-color 0.2s, opacity 0.2s, transform 0.1s;
                    margin-top: 20px;
                    box-shadow: 0 4px 10px rgba(140, 82, 48, 0.3);
                }
                .proceed-payment-btn:hover:not(:disabled) {
                    background-color: #4A3C35;
                    transform: translateY(-1px);
                }
                .proceed-payment-btn:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                    box-shadow: none;
                }
                .loading-spinner {
                    border: 4px solid rgba(255, 255, 255, 0.3);
                    border-top: 4px solid #fff;
                    border-radius: 50%;
                    width: 18px;
                    height: 18px;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }

                /* === MOBILE ADAPTIVE LAYOUT === */
                @media (max-width: 900px) {
                    .checkout-content {
                        /* Switch to single column */
                        grid-template-columns: 1fr;
                        gap: 30px;
                    }
                    .checkout-header {
                        font-size: 1.8em;
                        margin-bottom: 20px;
                    }
                    .order-summary-section {
                        /* Remove sticky positioning on mobile */
                        position: static;
                    }
                    .address-form-section {
                        /* Reorder: put form details before summary on mobile */
                        order: 1;
                    }
                    .order-summary-section {
                        /* Reorder: put summary first on mobile */
                        order: 0;
                    }
                }
                
                @media (max-width: 550px) {
                    .checkout-container-page {
                        padding: 20px 10px;
                    }
                    .checkout-header {
                        flex-direction: column;
                        align-items: flex-start;
                        padding-bottom: 10px;
                    }
                    .back-to-cart {
                        margin-top: 10px;
                        padding-left: 0;
                    }
                    .form-grid {
                        /* Single column grid for form inputs */
                        grid-template-columns: 1fr;
                    }
                    .address-form-section, .order-summary-section {
                        padding: 20px;
                    }
                }
            `}</style>

            <div className="checkout-content">
                <div className="checkout-header">
                    Shipping Details
                    <button className="back-to-cart" onClick={onBackToCart}>
                        &#x2190; Back to Cart
                    </button>
                </div>

                <div className="address-form-section">
                    <h3>1. Shipping Address</h3>
                    <form onSubmit={handleSubmit}>
                        <div className="form-grid">
                            
                            {/* Full Name */}
                            <div className="form-group full-width">
                                <label htmlFor="fullName">Full Name</label>
                                <input
                                    id="fullName"
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    placeholder="Enter your full name"
                                    required
                                />
                                {errors.fullName && <div className="error-message">{errors.fullName}</div>}
                            </div>
                            
                            {/* Address Line 1 */}
                            <div className="form-group full-width">
                                <label htmlFor="addressLine1">Address Line 1</label>
                                <input
                                    id="addressLine1"
                                    type="text"
                                    name="addressLine1"
                                    value={formData.addressLine1}
                                    onChange={handleChange}
                                    placeholder="House/Flat No., Building, Street"
                                    required
                                />
                                {errors.addressLine1 && <div className="error-message">{errors.addressLine1}</div>}
                            </div>
                            
                            {/* Address Line 2 (Optional) */}
                            <div className="form-group full-width">
                                <label htmlFor="addressLine2">Address Line 2 (Optional)</label>
                                <input
                                    id="addressLine2"
                                    type="text"
                                    name="addressLine2"
                                    value={formData.addressLine2}
                                    onChange={handleChange}
                                    placeholder="Landmark, Area"
                                />
                            </div>

                            {/* City */}
                            <div className="form-group">
                                <label htmlFor="city">City</label>
                                <input
                                    id="city"
                                    type="text"
                                    name="city"
                                    value={formData.city}
                                    onChange={handleChange}
                                    placeholder="e.g., Bangalore"
                                    required
                                />
                                {errors.city && <div className="error-message">{errors.city}</div>}
                            </div>
                            
                            {/* State */}
                            <div className="form-group">
                                <label htmlFor="state">State</label>
                                <input
                                    id="state"
                                    type="text"
                                    name="state"
                                    value={formData.state}
                                    onChange={handleChange}
                                    placeholder="e.g., Karnataka"
                                    required
                                />
                                {errors.state && <div className="error-message">{errors.state}</div>}
                            </div>

                            {/* Zip Code */}
                            <div className="form-group">
                                <label htmlFor="zip">Zip Code (6 digits)</label>
                                <input
                                    id="zip"
                                    type="number"
                                    name="zip"
                                    value={formData.zip}
                                    onChange={handleChange}
                                    placeholder="Enter 6-digit code"
                                    maxLength="6"
                                    required
                                />
                                {errors.zip && <div className="error-message">{errors.zip}</div>}
                            </div>
                            
                            {/* Phone Number */}
                            <div className="form-group">
                                <label htmlFor="phone">Phone Number (10 digits)</label>
                                <input
                                    id="phone"
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="Enter 10-digit number"
                                    maxLength="10"
                                    required
                                />
                                {errors.phone && <div className="error-message">{errors.phone}</div>}
                            </div>
                            
                            {/* Email */}
                            <div className="form-group full-width">
                                <label htmlFor="email">Email Address</label>
                                <input
                                    id="email"
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder="name@example.com"
                                    required
                                />
                                {errors.email && <div className="error-message">{errors.email}</div>}
                            </div>

                            {/* Save Address Checkbox */}
                            <div className="checkbox-group">
                                <input
                                    id="saveAddress"
                                    type="checkbox"
                                    name="saveAddress"
                                    checked={formData.saveAddress}
                                    onChange={handleChange}
                                />
                                <label htmlFor="saveAddress">Save this address for future orders</label>
                            </div>

                            {/* Proceed Button */}
                            <div className="full-width">
                                <CheckoutButton 
                                    amount={finalTotal.discountedTotalDisplay} 
                                    customer={{
                                        name: formData.fullName,
                                        email: formData.email,
                                        phone: formData.phone,
                                        address: formData
                                    }}
                                    items={cartItems}
                                />

                            </div>
                        </div>
                    </form>
                </div>

                {/* Order Summary Section */}
                <div className="order-summary-section">
                    <h3>Order Summary</h3>
                    
                    <div className="summary-items">
                        {cartItems.map(item => (
                            <div key={item.id} className="summary-row" style={{ color: '#333' }}>
                                <span>{item.name} (x{item.quantity})</span>
                                <span style={{ fontWeight: 600 }}>₹{(item.price * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>

                    <div className="summary-row">
                        <span>Items Subtotal ({totalItems} items)</span>
                        <span>₹{finalTotal.subtotalDisplay}</span>
                    </div>
                    
                    <div className="summary-row">
                        <span>Shipping</span>
                        <span style={{ color: '#388e3c', fontWeight: 600 }}>FREE</span>
                    </div>
                    
                    {finalTotal.discount > 0 && (
                        <div className="summary-row">
                             <span style={{ color: '#388e3c', fontWeight: 600 }}>Discount</span>
                            <span style={{ color: '#388e3c', fontWeight: 600 }}>-₹{finalTotal.discount.toFixed(2)}</span>
                        </div>
                    )}

                    <div className="summary-total">
                        <span>Order Total</span>
                        <span>₹{finalTotal.discountedTotalDisplay}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CheckoutPage;
