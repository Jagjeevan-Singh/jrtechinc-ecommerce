import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth"; 
import { auth } from "./firebase";

import Layout from "./components/Layout";
import ProductLanding from "./components/ProductLanding";
import ProductsPage from "./components/ProductsPage";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import About from "./pages/About";
import Account from "./pages/Account";
import Login from "./pages/Login";
import Register from "./components/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Terms from "./pages/Terms";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import ReturnPolicy from "./pages/ReturnPolicy";
import ShippingPolicy from "./pages/ShippingPolicy";
import ContactUs from "./components/ContactUs";
import AdminDashboard from "./components/AdminDashboard";
import CheckoutPage from "./pages/CheckoutPage";   // ✅ NEW

import "./App.css";

const API_URL = "http://localhost:3000/api/products"; 

function App() {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);

  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const [currentUser, setCurrentUser] = useState(null); 
  const [loadingAuth, setLoadingAuth] = useState(true); 
  const [loadingUser] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const data = await response.json();

        const initialProducts = data.map(p => ({
          ...p,
          isWishlisted: false,
          id: p._id 
        }));

        setProducts(initialProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setProductsError("Could not connect to the product database.");
      } finally {
        setLoadingProducts(false);
      }
    };

    fetchAllProducts();
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoadingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  const addToCart = (productWithVariant) => {
    const id = productWithVariant.id;
    const selectedVariant = productWithVariant.selectedVariant;
    const quantityToAdd = productWithVariant.quantity || 1; 
    const uniqueCartKey = `${id}-${selectedVariant?.sku || 'default'}`;

    setCartItems((prevCartItems) => {
      const existingItem = prevCartItems.find((item) => item.uniqueKey === uniqueCartKey);
      const price = selectedVariant?.variantPrice || productWithVariant.discountedPrice || productWithVariant.price || 0;

      if (existingItem) {
        return prevCartItems.map((item) =>
          item.uniqueKey === uniqueCartKey ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      } else {
        return [
          ...prevCartItems, 
          { 
            ...productWithVariant, 
            uniqueKey: uniqueCartKey,
            price, 
            quantity: quantityToAdd,
            variantName: selectedVariant?.variantName,
            variantSku: selectedVariant?.sku,
            variantPrice: price 
          }
        ];
      }
    });
  };

  const handleWishlistToggle = (product) => {
    setWishlistItems((prevWishlistItems) => {
      const exists = prevWishlistItems.find((item) => item.id === product.id);
      return exists
        ? prevWishlistItems.filter((item) => item.id !== product.id)
        : [...prevWishlistItems, { ...product, isWishlisted: true }];
    });
  };

  const removeFromCart = (uniqueKey) => {
    setCartItems((prev) => prev.filter((item) => item.uniqueKey !== uniqueKey));
  };

  const updateCartQuantity = (uniqueKey, newQty) => {
    if (newQty <= 0) {
      removeFromCart(uniqueKey);
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.uniqueKey === uniqueKey ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveToCart = (product) => {
    removeFromWishlist(product.id);
    addToCart({ ...product, quantity: 1, selectedVariant: product.variants?.[0] }); 
  };

  const handleMoveToWishlistFromCart = (item) => {
    handleWishlistToggle(item); 
    removeFromCart(item.uniqueKey); 
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0); // ✅ NEW

  if (loadingUser || loadingProducts || loadingAuth) { 
    return <div className="loading-screen">Loading application data...</div>;
  }
  
  if (productsError) {
    return <div style={{ color: 'red', textAlign: 'center', padding: '50px' }}>
      Error: {productsError}. Please check your Node.js server.
    </div>;
  }

  return (
    <Router>
      <Routes>

        <Route path="/admin-login" element={<AdminDashboard />} />

        <Route path="/account" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <Account />
          </Layout>
        } />

        <Route path="/login" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <Login />
          </Layout>
        } />

        <Route path="/register" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <Register />
          </Layout>
        } />

        <Route path="/forgot-password" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <ForgotPassword />
          </Layout>
        } />

        <Route path="/cart" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <Cart cartItems={cartItems} onRemove={removeFromCart} onUpdateQuantity={updateCartQuantity} onMoveToWishlist={handleMoveToWishlistFromCart} />
          </Layout>
        } />

        {/* ✅ NEW CHECKOUT ROUTE */}
        <Route path="/checkout" element={
          <Layout cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <CheckoutPage cartItems={cartItems} subtotal={subtotal} />
          </Layout>
        } />

        <Route path="/wishlist" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <Wishlist items={wishlistItems} onRemove={removeFromWishlist} onMoveToCart={moveToCart} />
          </Layout>
        } />

        <Route path="/products" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <ProductsPage products={products} onAdd={addToCart} onWishlist={handleWishlistToggle} />
          </Layout>
        } />

        <Route path="/product/:id" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <ProductLanding products={products} onAddToCart={addToCart} onAddToWishlist={handleWishlistToggle} />
          </Layout>
        } />

        <Route path="/about" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><About /></Layout>} />
        <Route path="/contact" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><ContactUs /></Layout>} />
        <Route path="/terms" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><Terms /></Layout>} />
        <Route path="/privacy" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><PrivacyPolicy /></Layout>} />
        <Route path="/return-policy" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><ReturnPolicy /></Layout>} />
        <Route path="/shipping-policy" element={<Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}><ShippingPolicy /></Layout>} />

        <Route path="/" element={
          <Layout cartCount={cartCount} wishlistCount={wishlistItems.length} currentUser={currentUser}>
            <ProductsPage products={products} onAdd={addToCart} onWishlist={handleWishlistToggle} />
          </Layout>
        } />

      </Routes>
    </Router>
  );
}

export default App;
