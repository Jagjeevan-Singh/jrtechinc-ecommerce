import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom"; // Import Link for routing
import "./Home.css"; 
// Assuming your assets are correctly imported
import banner1 from "../assets/Banner1.jpeg";
import banner2 from "../assets/Banner2.jpeg";
import banner3 from "../assets/Banner3.jpeg";

const Home = () => {
    // --- Banner State & Logic ---
    const banners = [banner1, banner2, banner3];
    const [currentIndex, setCurrentIndex] = useState(0);

    // --- Product State ---
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Auto-slide every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            );
        }, 3000);
        return () => clearInterval(interval);
    }, [banners.length]);

    // --- API Fetch Logic ---
    const BACKEND_HOST = import.meta.env.VITE_BACKEND_URL || 'https://jrtechinc-ecommerce.onrender.com';
    useEffect(() => {
        const fetchFeatured = async () => {
            try {
                // Try proxied API first
                console.log('Fetching featured products from: /api/products');
                let response = await fetch('/api/products');
                
                // If proxied request fails or returns HTML, try direct backend
                if (!response.ok || response.headers.get('content-type')?.includes('text/html')) {
                    console.warn('Proxied API failed, trying direct backend:', `${BACKEND_HOST}/api/products`);
                    response = await fetch(`${BACKEND_HOST}/api/products`);
                }
                
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                
                const data = await response.json();
                console.log('Featured products loaded:', data.length);
                
                // Take the first 4 products as "featured"
                setFeaturedProducts(data.slice(0, 4)); 
            } catch (error) {
                console.error("Could not fetch featured products:", error);
                // Fail gracefully: featuredProducts will remain empty
            } finally {
                setLoading(false);
            }
        };
        
        fetchFeatured();
    }, []); // Run only once on component mount

    return (
        <div className="home-container">
            {/* Auto Scrolling Banner */}
            <div className="banner-slider">
                {banners.map((img, index) => (
                    <div
                        className={`banner-slide ${
                            index === currentIndex ? "active" : ""
                        }`}
                        key={index}
                    >
                                                {/* Adding a Link around the banner is common for promotions */}
                                                <Link to="/products-sidebar">
                                                    <img src={img} alt={`Banner ${index + 1}`} style={{cursor: 'pointer'}} />
                                                </Link>
                    </div>
                ))}
            </div>

            {/* Featured Products Section */}
            <section className="featured-section">
                <h2>Featured Products</h2>
                
                {loading && <p>Loading featured items...</p>}

                {!loading && featuredProducts.length === 0 && (
                    <p>No featured products available. Add some data via Postman!</p>
                )}
                
                <div className="featured-grid">
                    {featuredProducts.map((product) => (
                        // Use Link to route to the individual product page
                        <Link 
                            to={`/products/${product._id}`} 
                            key={product._id} 
                            className="featured-card-link"
                        >
                            <div className="product-card">
                                {/* Display the first image in the array, or a placeholder */}
                                <img 
                                    src={product.imageUrls && product.imageUrls.length > 0 ? product.imageUrls[0] : 'placeholder.jpg'} 
                                    alt={product.name} 
                                />
                                <h3>{product.name}</h3>
                                {/* Display the discounted price, using the virtual or actual field */}
                                <p className="price">₹{product.discountedPrice || product.price || 'N/A'}</p> 
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home;