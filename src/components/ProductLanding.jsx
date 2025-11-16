import CustomerReviewList from './CustomerReviewList';
import './CustomerReviewList.css';
import CustomerReviewDrawer from './CustomerReviewDrawer';
import './CustomerReviewDrawer.css';

// Vite: import all images in assets at build time
const images = import.meta.glob('../assets/*', { eager: true, as: 'url' });

function ProductImage({ src, alt, ...props }) {
    let finalSrc = src;
    if (finalSrc && finalSrc.startsWith('https:https://')) {
        finalSrc = finalSrc.substring(5);
    }
    
    if (finalSrc && !finalSrc.startsWith('http')) {
        const match = Object.entries(images).find(([key]) => key.endsWith('/' + finalSrc));
        if (match) {
            return <img src={match[1]} alt={alt} {...props} />;
        }
    }
    return <img src={finalSrc} alt={alt} {...props} />;
}

import { useParams, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaMinus, FaShareAlt, FaCheckCircle, FaCartPlus, FaHeart, FaWhatsapp } from 'react-icons/fa';
import './ProductLanding.css';
import ProductRating2 from '../pages/ProductRating2';
import CustomerReviewSummary from './CustomerReviewSummary';
import './CustomerReviewSummary.css';

function ProductLanding({ products, onAddToCart, onAddToWishlist }) {
    
    // --- PRODUCT LOOKUP ---
    const { id } = useParams();
    const location = useLocation();
    const product = products.find(p => String(p.id) === String(id)) || location.state?.product;

    // --- Component State ---
    const [allReviews, setAllReviews] = useState([]);
    const [showReviewDrawer, setShowReviewDrawer] = useState(false);
    
    // --- DYNAMIC VARIANT/QUANTITY STATE ---
    const [selectedVariant, setSelectedVariant] = useState(null);
    const [quantity, setQuantity] = useState(1); 

    // --- Image Gallery and Zoom State ---
    const galleryImages = product?.imageUrls && Array.isArray(product.imageUrls) 
        ? product.imageUrls 
        : (product?.mainImage ? [product.mainImage] : []);
    
    const [selectedImage, setSelectedImage] = useState(galleryImages[0] || '');
    const [showZoom, setShowZoom] = useState(false);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const imgRef = useRef(null);

    // --- EFFECTS ---
    useEffect(() => {
        if (product?.variants?.length > 0 && !selectedVariant) {
            const initialVariant = product.variants[0];
            setSelectedVariant(initialVariant);
            // Ensure selectedImage starts as the variant's image if one exists
            setSelectedImage(initialVariant.variantImage || galleryImages[0] || '');
            setQuantity(1); 
        }
    }, [product, selectedVariant, galleryImages]);
    
    // NOTE: Removed the second useEffect, as the first one handles initialization and variant change logic is now inside handleVariantSelect.
    
    if (!product) {
        return <div className="product-landing-container" style={{ padding: '2rem', textAlign: 'center' }}>Product not found or still loading...</div>;
    }

    // --- DYNAMIC VALUE CALCULATIONS ---
    const baseSellingPrice = product.discountedPrice || product.price || 0;
    const mrpPrice = product.mrp || 0;
    const finalPrice = selectedVariant?.variantPrice || baseSellingPrice;
    const finalMRP = selectedVariant?.mrpPrice || mrpPrice; 
    const currentStock = selectedVariant ? selectedVariant.quantity : (product.stock || 0);
    const isOutOfStock = currentStock <= 0;
    const finalDescription = product.description ? product.description.replace(/\n/g, '<br/>') : '';
    
    // 🚨 IMAGE FIX: Prioritize selectedImage (user click) over the variant image, 
    // unless selectedImage is empty, in which case use the variant image.
    const primaryImageSource = selectedImage || selectedVariant?.variantImage || galleryImages[0];
    
    const dynamicProductDetails = product.productDetails || []; 
    const premiumGallery = product.contentGallery || []; 

    // --- HANDLERS ---
    const handleVariantSelect = (variant) => {
        setSelectedVariant(variant);
        // On variant change, automatically set the main image to the variant image
        setSelectedImage(variant.variantImage || galleryImages[0] || ''); 
        setQuantity(1);
    };
    
    const handleShare = async () => {
        if (navigator.share) {
            try { await navigator.share({ title: product.name, text: `Check out this product: ${product.name}`, url: window.location.href }); } 
            catch (error) { console.error('Error sharing product:', error); }
        } else {
            alert(`Link copied: ${window.location.href}`);
            navigator.clipboard.writeText(window.location.href);
        }
    };

    const decreaseQuantity = () => setQuantity(prev => Math.max(1, prev - 1));
    const increaseQuantity = () => setQuantity(prev => Math.min(currentStock, prev + 1));

    // Consolidate thumbnail images: variant image first (if different from current set) + all gallery images
    const thumbImages = selectedVariant?.variantImage 
        ? [selectedVariant.variantImage, ...galleryImages.filter(img => img !== selectedVariant.variantImage)] 
        : galleryImages;
        
    return (
        <>
            <div className="product-landing-container">
                {/* --- MAIN CONTENT: GRID (Image + Details) --- */}
                <div className="product-main-content">
                    {/* Left Column: Image Gallery */}
                    <div className="product-image-gallery">
                        {/* Thumbnails */}
                        <div className="product-thumbnails">
                            {thumbImages.map((img) => (
                                <ProductImage
                                    key={img} 
                                    src={img}
                                    alt={`${product.name} thumbnail`}
                                    // Check if this thumbnail matches the current selectedImage state
                                    className={`thumb-image${primaryImageSource === img ? ' selected' : ''}`}
                                    onClick={() => setSelectedImage(img)}
                                />
                            ))}
                        </div>
                        {/* Main image and Zoom */}
                        <div className="main-image-wrapper">
                            <ProductImage
                                ref={imgRef}
                                src={primaryImageSource} // Uses the corrected prioritized source
                                alt={product.name}
                                className="main-product-image"
                                onMouseEnter={() => setShowZoom(true)}
                                onMouseLeave={() => setShowZoom(false)}
                                onMouseMove={e => {
                                    if (!imgRef.current) return;
                                    const rect = imgRef.current.getBoundingClientRect();
                                    const x = e.clientX - rect.left;
                                    const y = e.clientY - rect.top;
                                    setZoomPos({ x, y });
                                }}
                            />
                            {/* Reflection/mirror element uses the same image URL as a background so we can flip/blur it */}
                            <div
                                className="image-reflection"
                                style={{ backgroundImage: `url(${primaryImageSource})` }}
                                aria-hidden="true"
                            />
                            {showZoom && imgRef.current && (
                                <div 
                                    className="image-zoom-lens" 
                                    style={{ 
                                        left: `${zoomPos.x - 50}px`,
                                        top: `${zoomPos.y - 50}px`,
                                        display: showZoom ? 'block' : 'none'
                                    }}
                                >
                                    <div 
                                        className="image-zoom-area" 
                                        style={{ 
                                            backgroundImage: `url(${primaryImageSource})`,
                                            backgroundPosition: `${(zoomPos.x / imgRef.current.offsetWidth) * 100}% ${(zoomPos.y / imgRef.current.offsetHeight) * 100}%`,
                                            backgroundSize: '250%'
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Product Details (Shorter content area) */}
                    <div className="product-details">
                        <h1 className="product-title product-landing-title">{product.name}</h1>
                        <p className="product-brand">{product.brand || product.category}</p>
                        
                        <div className="product-rating-row">
                            <ProductRating2 avg={product.averageRating || 0} count={product.reviewCount || 0} />
                            <span className="review-count">({product.reviewCount || 0} reviews)</span>
                            <button className="share-button" onClick={handleShare} title="Share this product">
                                <FaShareAlt /> Share
                            </button>
                        </div>
                        
                        <div className="product-price-info">
                            <span className="current-price">₹{finalPrice.toFixed(2)}</span>
                            {finalMRP > finalPrice && (
                                (() => {
                                    const discountPct = finalMRP && finalMRP > finalPrice ? Math.round(((finalMRP - finalPrice) / finalMRP) * 100) : 0;
                                    return (
                                        <>
                                            <span className="original-price-strike">₹{finalMRP.toFixed(2)}</span>
                                            {discountPct > 0 && <span className="discount-pct">-{discountPct}%</span>}
                                        </>
                                    );
                                })()
                            )}
                        </div>
                        
                        {isOutOfStock && (<div className="out-of-stock-badge">Out of Stock</div>)}
                        
                        {/* --- 2. VARIANT SELECTOR --- */}
                        {product.variants?.length > 0 && (
                            <div className="product-variant-selector">
                                <p className="variant-label">Colour: <strong>{selectedVariant?.variantName || 'Select'}</strong></p>
                                <div className="variant-options-grid">
                                    {product.variants.map((variant) => (
                                        <div
                                            key={variant.sku}
                                            className={`variant-card ${selectedVariant?.sku === variant.sku ? 'selected' : ''}`}
                                            onClick={() => handleVariantSelect(variant)}
                                            role="button" 
                                            tabIndex="0" 
                                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { handleVariantSelect(variant); }}}
                                        >
                                            <ProductImage src={variant.variantImage || galleryImages[0]} alt={variant.variantName} className="variant-thumb" />
                                            <div className="variant-price-detail">
                                                <span className="variant-name">{variant.variantName}</span>
                                                <span className="variant-selling-price">₹{(variant.variantPrice || baseSellingPrice).toFixed(2)}</span>
                                                {(variant.mrpPrice > (variant.variantPrice || baseSellingPrice)) && (
                                                    <span className="variant-mrp-price">₹{variant.mrpPrice.toFixed(2)}</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {/* --- Quantity Selector --- */}
                        <div className="quantity-selector-container">
                            <label htmlFor="quantity" className="quantity-label">Quantity:</label>
                            <div className="quantity-input-group">
                                <button type="button" onClick={decreaseQuantity} disabled={quantity <= 1 || isOutOfStock} className="quantity-btn minus-btn">
                                    <FaMinus />
                                </button>
                                <input 
                                    type="number" 
                                    id="quantity"
                                    className="quantity-input" 
                                    value={quantity} 
                                    onChange={(e) => setQuantity(Math.max(1, Math.min(currentStock, Number(e.target.value))))}
                                    min="1"
                                    max={currentStock}
                                    disabled={isOutOfStock}
                                />
                                <button type="button" onClick={increaseQuantity} disabled={quantity >= currentStock || isOutOfStock} className="quantity-btn plus-btn">
                                    <FaPlus />
                                </button>
                            </div>
                            {!isOutOfStock && currentStock > 0 && currentStock <= 5 && (
                                <span className="low-stock-warning">Only {currentStock} left in stock!</span>
                            )}
                        </div>

                        {/* --- 6. ACTION BUTTONS --- */}
                        <div className="product-actions-buttons">
                            <button 
                                className="add-to-cart-btn" 
                                onClick={() => onAddToCart({ ...product, selectedVariant: selectedVariant, quantity: quantity })} 
                                disabled={isOutOfStock || quantity === 0}
                            >
                                <FaCartPlus style={{ marginRight: 8 }} /> Add to Cart
                            </button>
                            <button className="add-to-wishlist-btn" onClick={() => onAddToWishlist(product)} disabled={isOutOfStock}>
                                <FaHeart style={{ marginRight: 8 }} /> Add to Wishlist
                            </button>
                        </div>

                        {/* Bulk enquiry via WhatsApp */}
                        <div className="bulk-enquiry-wrap">
                            <a className="bulk-enquiry-btn" href="https://wa.me/918527914649" target="_blank" rel="noopener noreferrer">
                                <FaWhatsapp style={{ marginRight: 8 }} /> For Bulk Enquiry
                            </a>
                        </div>
                        
                        {/* --- 3. MAIN DESCRIPTION (MOVED HERE TO SCROLL WITH RIGHT COLUMN) --- */}
                        {finalDescription.length > 0 && ( 
                            <div className="product-description-block main-description-block">
                                <h4 className="description-heading">Product Description</h4>
                                <p dangerouslySetInnerHTML={{ __html: finalDescription }}></p>
                            </div>
                        )}

                    </div> {/* End product-details */}
                </div> {/* End product-main-content */}
                
                {/* --- FULL-WIDTH SECTIONS BELOW THE MAIN GRID --- */}

                {/* --- PREMIUM GALLERY SECTION (Product Highlights) --- */}
                {premiumGallery.length > 0 && ( 
                    <section className="premium-gallery-section">
                        <h2>Product Highlights</h2>
                        <div className="premium-gallery-grid">
                            {premiumGallery.map((img, index) => (
                                <div key={index} className="premium-gallery-card">
                                    <ProductImage src={img} alt={`Highlight ${index + 1}`} className="premium-image" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* --- 4. WHAT'S IN THE BOX SECTION (Dynamic List) --- */}
                {dynamicProductDetails.length > 0 && ( 
                    <div className="product-details-inside">
                        <h4 className="description-heading">What's Included</h4>
                        <ul className="inside-list">
                            {/* FIX: Ensure item.detail is correct. Must be spelled 'detail' in MongoDB. */}
                            {dynamicProductDetails.map((item, index) => (
                                <li key={index} className="inside-item">
                                    <FaCheckCircle className="inside-icon" />
                                    {item.detail} 
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                
                {/* --- 5. CUSTOMER REVIEWS SECTION (Full Width) --- */}
                <div className="product-reviews-full-width">
                    <h4 className="description-heading">Customer Reviews</h4>
                    <CustomerReviewSummary
                        reviews={allReviews}
                        onWriteReview={() => setShowReviewDrawer(true)}
                    />
                    <CustomerReviewDrawer
                        open={showReviewDrawer}
                        onClose={() => setShowReviewDrawer(false)}
                        onSubmit={({ name, email, rating, comment }) => {
                            setAllReviews(reviews => [
                                { id: Date.now(), productId: product.id, userName: name, userEmail: email, rating, review: comment, createdAt: new Date().toISOString() },
                                ...reviews, 
                            ]);
                            setShowReviewDrawer(false);
                        }}
                    />
                    <CustomerReviewList reviews={allReviews} />
                </div>
                
            </div> {/* End product-landing-container */}
        </>
    );
}

export default ProductLanding;