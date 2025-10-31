import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./Account.css";

// Define the API URL for fetching orders (assuming /api/orders endpoint exists)
const ORDER_API_URL = "http://localhost:3000/api/orders";

const Account = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loadingAuth, setLoadingAuth] = useState(true);
    
    // State for dynamic order data
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [orderError, setOrderError] = useState(null);

    const navigate = useNavigate();

    // --- 1. Authentication Listener (No Change) ---
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setCurrentUser(user);
            setLoadingAuth(false);
        });
        return () => unsubscribe();
    }, []);

    // --- 2. Order Fetching Effect ---
    useEffect(() => {
        if (currentUser && currentUser.uid) {
            const fetchOrders = async () => {
                setLoadingOrders(true);
                setOrderError(null);
                try {
                    // NOTE: In a real app, this endpoint would be secure and filter by userId
                    // For this demo, we fetch all orders and assume the API filters them later.
                    const response = await fetch(ORDER_API_URL); 
                    
                    if (!response.ok) {
                        throw new Error("Failed to fetch orders.");
                    }
                    
                    const data = await response.json();
                    
                    // Filter orders by the current user's UID (Simulated client-side filtering)
                    const userOrders = data.filter(order => order.userId === currentUser.uid);

                    setOrders(userOrders);
                } catch (error) {
                    setOrderError("Could not load order history. Check API status.");
                    console.error(error);
                } finally {
                    setLoadingOrders(false);
                }
            };
            
            fetchOrders();
        }
    }, [currentUser]); // Re-run when currentUser changes

    // --- Handlers ---
    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out:", error);
            alert("Error signing out. Please try again.");
        }
    };
    
    // Handler for simulating a payment retry
    const handleRetryPayment = (orderId) => {
        alert(`Simulating retry for Order ID: ${orderId}. In a real app, this would call the payment gateway.`);
        // TODO: Implement actual API call to retry payment
    };
    
    // --- TEMPORARY USER DETAILS ---
    const userDetails = {
        name: currentUser?.displayName || "Customer",
        email: currentUser?.email || "N/A",
    };

    if (loadingAuth) {
        return <div className="account-container"><h2>Loading authentication status...</h2></div>;
    }

    // --- CONDITIONAL RENDERING: LOGIN PROMPT ---
    if (!currentUser) {
        return (
            <div className="account-container account-login-prompt">
                <div className="login-prompt-box">
                    <h1>Sign In to Your Account</h1>
                    <p>To access your order history, saved addresses, and profile details, please sign in or create an account.</p>
                    
                    <div className="action-buttons">
                        <button className="btn primary-btn" onClick={() => navigate('/login')}>
                            Sign In Now
                        </button>
                        <Link to="/register" className="btn secondary-btn">
                            Create a New Account
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // --- RENDER LOGGED-IN USER DASHBOARD ---
    return (
        <div className="account-container">
            <h1>Welcome Back, {userDetails.name.split(' ')[0] || 'Customer'}</h1>
            
            <div className="account-section">
                <h2>Account Details</h2>
                <div className="account-details-block">
                    <p><strong>Name:</strong> {userDetails.name}</p>
                    <p><strong>Email:</strong> {userDetails.email}</p>
                    <p><strong>Member Status:</strong> Verified via Firebase</p>
                </div>
            </div>

            <div className="account-section">
                <h2>Order History</h2>
                {loadingOrders && <p>Loading your order history...</p>}
                {orderError && <p style={{ color: 'red' }}>Error loading orders: {orderError}</p>}
                
                {!loadingOrders && orders.length === 0 ? (
                    <p>You have no recent orders yet.</p>
                ) : (
                    <table className="order-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Status</th>
                                <th>Date</th>
                                <th>Amount (₹)</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order) => {
                                // Determine display status based on API data (assuming fields like paymentStatus)
                                const status = order.paymentStatus || 'Pending';
                                const isFailed = status.includes('Failed');
                                const isSuccess = status.includes('Successful');

                                return (
                                    <tr key={order._id}>
                                        <td>{order._id.substring(0, 8)}...</td>
                                        <td>
                                            <span className={`status-badge ${isFailed ? 'failed' : isSuccess ? 'success' : 'pending'}`}>
                                                {order.orderStatus} ({status})
                                            </span>
                                        </td>
                                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                                        <td>{order.totalAmount.toFixed(2)}</td>
                                        <td>
                                            {isFailed && (
                                                <button 
                                                    className="btn retry-btn" 
                                                    onClick={() => handleRetryPayment(order._id)}
                                                >
                                                    Retry Payment
                                                </button>
                                            )}
                                            {!isFailed && <span style={{ color: isSuccess ? 'green' : 'gray' }}>{isSuccess ? 'Paid' : 'Review'}</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
            
            <div className="account-footer-actions">
                <button className="btn logout-btn" onClick={handleSignOut}>
                    Sign Out
                </button>
                <Link to="/orders" className="btn view-orders-btn">
                    View All Orders
                </Link>
            </div>
        </div>
    );
};

export default Account;