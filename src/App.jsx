// App.jsx
import React, { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";

// Components
import Layout from "./components/Layout";
import ProductLanding from "./components/ProductLanding";
import ProductsPage from "./components/ProductsPage";
import Cart from "./components/Cart";
import Wishlist from "./components/Wishlist";
import About from "./components/About";
import Account from "./pages/Account";
import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import Terms from "./components/Terms";
import PrivacyPolicy from "./components/PrivacyPolicy";
import ReturnPolicy from "./components/ReturnPolicy";
import ShippingPolicy from "./components/ShippingPolicy";
import ContactUs from "./components/ContactUs";

import "./App.css";



function App() {
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [products, setProducts] = useState([]);
  // No auth loading needed for static app
  const [loadingUser] = useState(false);

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      return existing
        ? prev.map((item) =>
            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        : [...prev, { ...product, quantity: 1 }];
    });
  };

  const handleWishlistToggle = (product) => {
    setWishlistItems((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      } else {
        return [...prev, { ...product, isWishlisted: true }];
      }
    });
  };

  const removeFromCart = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateCartQuantity = (id, newQty) => {
    if (newQty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.id !== id));
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
      );
    }
  };

  const removeFromWishlist = (id) => {
    setWishlistItems((prev) => prev.filter((item) => item.id !== id));
  };

  const moveToCart = (product) => {
    removeFromWishlist(product.id);
    addToCart(product);
  };

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  if (loadingUser) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/account"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Account />
            </Layout>
          }
        />
        <Route
          path="/cart"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Cart
                cartItems={cartItems}
                onRemove={removeFromCart}
                onUpdateQuantity={updateCartQuantity}
              />
            </Layout>
          }
        />
        <Route
          path="/login"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Login />
            </Layout>
          }
        />
        <Route
          path="/register"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Register />
            </Layout>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ForgotPassword />
            </Layout>
          }
        />
        <Route
          path="/products"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ProductsPage
                products={products}
                onAdd={addToCart}
                onWishlist={handleWishlistToggle}
              />
            </Layout>
          }
        />
        <Route
          path="/product/:id"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ProductLanding
                products={products}
                onAddToCart={addToCart}
                onAddToWishlist={handleWishlistToggle}
              />
            </Layout>
          }
        />
        <Route
          path="/wishlist"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Wishlist
                items={wishlistItems}
                onRemove={removeFromWishlist}
                onMoveToCart={moveToCart}
              />
            </Layout>
          }
        />
        <Route
          path="/about"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <About />
            </Layout>
          }
        />
          <Route
            path="/contact"
            element={
              <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
                <ContactUs />
              </Layout>
            }
          />
import ContactUs from "./components/ContactUs";
        <Route
          path="/terms"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <Terms />
            </Layout>
          }
        />
        <Route
          path="/privacy"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <PrivacyPolicy />
            </Layout>
          }
        />
        <Route
          path="/return-policy"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ReturnPolicy />
            </Layout>
          }
        />
        <Route
          path="/shipping-policy"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ShippingPolicy />
            </Layout>
          }
        />
        <Route
          path="/"
          element={
            <Layout cartCount={cartCount} wishlistCount={wishlistItems.length}>
              <ProductsPage
                products={products}
                onAdd={addToCart}
                onWishlist={handleWishlistToggle}
              />
            </Layout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;