import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../firebase";
import "./Account.css";
import './Orders.css';

// Define the API URL for fetching orders (use relative path so Vite/dev proxy can forward requests)
const ORDER_API_URL = "/api/orders";

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
                    // Try relative path first (works when frontend proxy or same-origin is set up)
                    let response;
                    try {
                        response = await fetch(ORDER_API_URL);
                    } catch (err) {
                        console.warn('Relative /api request failed, will retry with http://localhost:3000', err && err.message);
                    }

                    // If relative fetch failed or returned non-ok, try direct backend host as a fallback
                    if (!response || !response.ok) {
                        try {
                            response = await fetch('http://localhost:3000/api/orders');
                        } catch (err) {
                            console.error('Fallback to http://localhost:3000 failed', err && err.message);
                        }
                    }

                    if (!response) throw new Error('No response from orders API');
                    if (!response.ok) {
                        const text = await response.text().catch(()=>null);
                        throw new Error(`Orders API responded with ${response.status}: ${text || response.statusText}`);
                    }

                    // Guard: ensure server returned JSON. Vite dev server may return
                    // index.html (HTML) for unknown routes when proxy isn't configured.
                    const contentType = response.headers.get('content-type') || '';
                    if (!contentType.includes('application/json')) {
                        const text = await response.text().catch(()=>null);
                        throw new Error(`Expected JSON from Orders API but got ${contentType || 'non-JSON'}: ${text?.slice(0,300)}`);
                    }

                    const data = await response.json();

                    // Normalize response shape: accept either an array or { value: [...] }
                    const ordersArray = Array.isArray(data) ? data : (Array.isArray(data.value) ? data.value : []);

                    // Filter orders by the current user's UID (Simulated client-side filtering).
                    const userOrders = ordersArray.filter(order => {
                        if (!order) return false;
                        const matchesUid = order.userId && (order.userId === currentUser.uid || order.userId === 'demo_user_12345');
                        const matchesEmail = order.userEmail && currentUser.email && order.userEmail === currentUser.email;
                        return matchesUid || matchesEmail;
                    });

                    // Save primary matched orders first (sorted newest first)
                    const sortedUserOrders = (userOrders || []).slice().sort((a, b) => {
                        const tb = Date.parse(b?.createdAt || b?.updatedAt || '') || 0;
                        const ta = Date.parse(a?.createdAt || a?.updatedAt || '') || 0;
                        return tb - ta;
                    });
                    setOrders(sortedUserOrders);

                    // Always attempt to fetch recent Payment records for this user
                    // and merge any that are missing from the Order documents. This
                    // ensures newly-created payments show up even if an Order doc
                    // hasn't been created yet. Merge by orderId or Payment._id.
                    if (currentUser?.uid || currentUser?.email) {
                        (async () => {
                            try {
                                const params = new URLSearchParams();
                                if (currentUser.uid) params.append('userId', currentUser.uid);
                                if (currentUser.email) params.append('email', currentUser.email);
                                const pRes = await fetch(`/api/debug/payments?${params.toString()}`);
                                if (!pRes.ok) return;
                                const payments = await pRes.json();
                                if (!payments || !payments.length) return;

                                // Build lookup of existing orderIds/_ids already present
                                const existingOrderIds = new Set((userOrders || []).map(o => String(o.orderId || o._id)));

                                const synthesized = payments
                                    .filter(p => !existingOrderIds.has(String(p.orderId || p._id)))
                                    .map(p => ({
                                        _id: p._id,
                                        orderId: p.orderId,
                                        items: p.items || [],
                                        totalAmount: Number(p.amount) || 0,
                                        shipping: p.shipping || null,
                                        deliveryAddress: p.deliveryAddress || null,
                                        paymentStatus: p.status || 'created',
                                        createdAt: p.createdAt
                                    }));

                                if (synthesized.length) {
                                    // Merge synthesized payments with existing orders and sort by date
                                    setOrders(prev => {
                                        const combined = [...synthesized, ...prev];
                                        combined.sort((a, b) => {
                                            const tb = Date.parse(b?.createdAt || b?.updatedAt || '') || 0;
                                            const ta = Date.parse(a?.createdAt || a?.updatedAt || '') || 0;
                                            return tb - ta;
                                        });
                                        return combined;
                                    });
                                }
                            } catch (e) {
                                console.warn('Could not fetch payments fallback', e && e.message);
                            }
                        })();
                    }
                } catch (error) {
                    setOrderError("Could not load order history. Check API status.");
                    console.error('Error fetching orders:', error && (error.message || error));
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
                <div className="account-inner">
                    <div className="account-hero">
                        <div className="hero-left">
                            <h1>Welcome Back, {userDetails.name.split(' ')[0] || 'Customer'}</h1>
                            <div className="subtitle">Manage your orders, addresses, and account settings</div>
                        </div>
                        <div className="hero-right">
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontWeight: 800, fontSize: 20 }}>{orders.length || 0}</div>
                                <div style={{ color: '#6b6f6a', fontSize: 13 }}>Recent orders</div>
                            </div>
                        </div>
                    </div>

                    <div className="account-section">
                            <h2>Account Details</h2>
                            <div className="account-details-block">
                                    <div className="account-details-left">
                                        <div className="account-detail-label">Name</div>
                                        <div className="account-detail-value">{userDetails.name}</div>
                                        <div className="account-meta">Member since: {currentUser?.metadata?.creationTime ? new Date(currentUser.metadata.creationTime).toLocaleDateString() : '—'}</div>
                                    </div>
                                    <div className="account-details-right">
                                        <div>
                                            <div className="account-detail-label">Email</div>
                                            <div className="account-detail-value">{userDetails.email}</div>
                                        </div>
                                        <div>
                                            <button className="btn" onClick={() => navigate('/account/edit')}>Edit</button>
                                        </div>
                                    </div>
                            </div>
                    </div>

            <div className="account-section">
                <h2>Order History</h2>
                {loadingOrders && <p>Loading your order history...</p>}
                {orderError && <p style={{ color: 'red' }}>Error loading orders: {orderError}</p>}
                
                {!loadingOrders && orders.length === 0 ? (
                    <p>You have no recent orders yet.</p>
                ) : (
                    <div className="orders-root">
                      <div className="orders-list">
                                                {orders.map(order => {
                                                    // Prefer explicit orderStatus if available (e.g. 'Cancelled')
                                                    const status = order.orderStatus || order.paymentStatus || order.status || 'Pending';
                                                    const isSuccess = /paid|success/i.test(status);
                                                    const isCancelled = /cancel/i.test(status);
                                                    const isFailed = /fail/i.test(status) || isCancelled;
                                                    const badgeClass = isSuccess ? 'badge-success' : isFailed ? 'badge-failed' : 'badge-pending';
                          const firstItem = (order.items && order.items[0]) || {};
                          const thumb = firstItem.imageUrl || firstItem.variantImage || `https://placehold.co/300x200?text=Order`;

                          return (
                            <div className="order-card" key={order._id} onClick={() => navigate(`/orders/${order._id}`)}>
                              <img className="order-thumb" src={thumb} alt={firstItem.name || 'Order item'} />
                              <div className="order-main">
                                <div className="order-title">{firstItem.name || `Order ${order._id.substring(0,8)}`} </div>
                                <div className="order-meta">{firstItem.variantName ? `${firstItem.variantName} • ` : ''}{order.items && order.items.length ? `${order.items.length} item(s)` : ''}</div>
                                <div className="order-meta">{order.shipping?.name || ''} • {new Date(order.createdAt).toLocaleDateString()}</div>
                                <div style={{ marginTop: 8 }}>
                                  <a className="small-link" href="#" onClick={(e) => { e.preventDefault(); navigate(`/orders/${order._id}`); }}>View order details</a>
                                </div>
                              </div>
                              <div className="order-right">
                                <div className="order-amount">₹{(order.totalAmount||0).toFixed(2)}</div>
                                <div className="order-status"><span className={`order-badge ${badgeClass}`}>{status}</span></div>
                                <div className="order-actions">
                                                                    <button className="btn" onClick={(e)=>{ e.stopPropagation(); navigate(`/orders/${order._id}`); }}>
                                                                        <span className="btn-label">View Details</span>
                                                                        <span className="btn-icon" aria-hidden>
                                                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                                <path d="M8 5v14l11-7L8 5z" fill="white" />
                                                                            </svg>
                                                                        </span>
                                                                    </button>
                                                                    {/* Rate & Review should go to the product landing page when possible */}
                                                                    <a className="small-link" href="#" onClick={(e)=>{ 
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        // Prefer explicit productId stored on the order item.
                                                                        const pid = firstItem?.productId || (order.items && order.items[0] && order.items[0].productId);
                                                                        if (pid) {
                                                                            navigate(`/product/${pid}`);
                                                                        } else {
                                                                            // Fallback: open the order details page so user can still view the order
                                                                            navigate(`/orders/${order._id}`);
                                                                        }
                                                                    }}>Rate & Review</a>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
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
      </div>
    );
};

export default Account;