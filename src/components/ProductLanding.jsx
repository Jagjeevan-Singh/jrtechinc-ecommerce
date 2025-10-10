import CustomerReviewList from './CustomerReviewList';
import './CustomerReviewList.css';
import CustomerReviewDrawer from './CustomerReviewDrawer';
// import { addDoc, serverTimestamp } from 'firebase/firestore';
import './CustomerReviewDrawer.css';
// Vite: import all images in assets at build time
const images = import.meta.glob('../assets/*', { eager: true, as: 'url' });

function ProductImage({ src, alt, ...props }) {
  if (src && !src.startsWith('http')) {
    const match = Object.entries(images).find(([key]) => key.endsWith('/' + src));
    if (match) {
      return <img src={match[1]} alt={alt} {...props} />;
    }
  }
  return <img src={src} alt={alt} {...props} />;
}

import { useParams, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { FaPlus, FaMinus } from 'react-icons/fa';
import './ProductLanding.css';
import ProductReviews from './ProductReviews';
import ProductRating2 from './ProductRating2';
import CustomerReviewSummary from './CustomerReviewSummary';
// import { collection, query, where, onSnapshot } from 'firebase/firestore';
// import { db } from '../firebase';
import './CustomerReviewSummary.css';

function ProductLanding({ products, onAddToCart, onAddToWishlist }) {
  // Collapsible sections state
  const [openSections, setOpenSections] = useState({
    how: true,
    inside: false,
    faqs: false,
    reviews: true,
  });
  const toggleSection = (key) => setOpenSections(s => ({ ...s, [key]: !s[key] }));

  const { id } = useParams();
  const location = useLocation();
  let product = null;
  // Use only the two provided products
  const defaultProducts = [
    {
      id: 1,
      name: "JR Ultimate Finger Exerciser & Hand Strengthener – Heavy Resistance Grip Ball for Men & Women – Finger Strength Trainer for Workout, Rehab, Stress Relief – Durable ABS Material (Multicolor, Heavier)",
      mrp: 999,
      price: 359,
      mainImage: 'hand-exercise.jpg',
      images: ['hand-exercise.jpg'],
      description: `🔥 Designed for Real Strength Training: The JR Ultimate Finger Exerciser Strength Trainer is engineered for serious finger and hand strengthening. Its ergonomic ball design ensures just the right amount of resistance to help build finger endurance, grip power, and hand flexibility without discomfort.\n\n🎯 Individually Adjustable Finger Tension: Featuring customized five-finger plungers, each finger can be trained individually. The adjustable tension system allows you to increase resistance per finger, making it perfect for progressive training. The silicone rubber pads provide a comfortable grip on both the palm and fingertips.\n\n💪 Improves Strength, Dexterity & Mobility: Ideal for those recovering from injury, dealing with arthritis, or simply wanting to enhance grip strength. The smooth, pain-free resistance makes it suitable for daily workouts and rehab therapy.\n\n⚙️ Heavy Resistance (Black Version) for Advanced Users: This black variant provides higher resistance—perfect for advanced users who need intense finger and grip workouts. Crafted from durable ABS material (Acrylonitrile Butadiene Styrene) to withstand daily usage.\n\n🎸 Versatile Use for Athletes, Musicians & Professionals: Whether you're a guitarist, pianist, rock climber, office worker, artist, or athlete, this hand strengthener helps enhance precision, stamina, and control. A perfect addition to your daily routine or physical therapy equipment.\n\n⚠️ IMPORTANT NOTE: This is not a toy or a light-use product. It’s designed for users who already have basic hand strength. If you lack strength or are looking for a soft grip exerciser, this is not recommended. To see real results, you must use it consistently and with dedication. Strength and stamina require effort—there are no shortcuts.`
    },
    {
      id: 2,
      name: "JR Micro Fiber Cloth for Car Cleaning - Ultra Absorbent Microfiber Cleaning Cloth - Soft & Scratch-Free Car Cleaning Clothes - Ideal Car Cleaning Accessories - Machine Washable",
      mrp: 499,
      price: 149,
      mainImage: 'microfiber-towel.jpg',
      images: ['microfiber-towel.jpg'],
      description: `Superior Absorbency for Effortless Cleaning: Our micro fiber cloth for car cleaning offers exceptional absorption, soaking up spills and debris with ease, saving you time and effort during your car maintenance routine. Its ultra-soft texture ensures a scratch-free finish, enhancing your vehicle's appearance, making it the ideal choice for perfectionists who want their car to shine immaculately after each wash.\n\nDurable and Long-lasting Design: This microfiber cloth for car cleaning stands up to repeated uses and washes, maintaining its form and effectiveness. It remains an essential part of your car cleaning accessories, ensuring longevity and durability with each use. Reduce replacement costs and environmental impact by investing in a cloth built to last, meeting the demands of frequent car enthusiasts and professionals alike.\n\nTime-Saving Quick Dry Technology: Experience a hassle-free drying process with our car towel for cleaning, equipped with enhanced quick-drying properties. Speed up your cleaning routine without leaving a trail of lint or residue behind. Ideal for busy lifestyles, it is engineered to keep up with fast-paced schedules, ensuring your vehicle looks pristine in no time.\n\nMulti-Purpose Cleaning Efficiency: Not just limited to your car, this versatile microfiber cleaning cloth is perfect for a range of tasks—whether it's detailing the interior, cleaning windows for a streak-free finish, or polishing surfaces at home. Its adaptability ensures you get maximum utility, seamlessly fitting into your cleaning toolkit for all-around household effectiveness.\n\nGentle and Safe for All Surfaces: Our car cleaning clothes ensure even the most delicate surfaces of your vehicle are treated gently, preventing scratching or marring. Perfect for maintaining the integrity of your car's paint and interior surfaces, it caters to car owners who value quality and care, delivering unmatched cleaning performance for every inch of your car.`
    }
  ];
  // Always use defaultProducts for product lookup
  if (id) {
    product = defaultProducts.find(p => String(p.id) === String(id));
  }
  if (!product && location.state?.product) {
    const stateProduct = location.state.product;
    product = defaultProducts.find(p => p.id === stateProduct.id || p.name === stateProduct.name) || stateProduct;
  }

  // Customer reviews state for summary (must be after product is determined)
  // Local reviews state (static or empty)
  const [allReviews, setAllReviews] = useState([]);
  const [showReviewDrawer, setShowReviewDrawer] = useState(false);

  // For espresso, show a fixed set of images as gallery
  const espressoGallery = [
    'espresso.jpg',
    '100instant.jpg',
    '7030instant.jpg',
    'cappuccino.jpg',
    'latte.jpg',
  ];
  const isEspresso = product && product.name && product.name.toLowerCase().includes('espresso');
  const galleryImages = isEspresso ? espressoGallery : (product.images && Array.isArray(product.images) ? product.images : [product.mainImage]);
  const [selectedImage, setSelectedImage] = useState(galleryImages[0] || product?.mainImage || '');
  const [showZoom, setShowZoom] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
  const imgRef = useRef(null);

  if (!product) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Product not found</div>;
  }

  return (
    <>

      <div className="product-landing">
        {/* Main image and thumbnails */}
        <div className="product-main-image">
          <div style={{position:'relative',display:'inline-block'}}>
            <ProductImage
              ref={imgRef}
              src={selectedImage}
              alt={product.name}
              style={{ cursor: 'zoom-in', width: '100%', maxWidth: 400, borderRadius: 12 }}
              onMouseEnter={() => setShowZoom(true)}
              onMouseLeave={() => setShowZoom(false)}
              onMouseMove={e => {
                const rect = imgRef.current.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                setZoomPos({ x, y });
              }}
            />
            {showZoom && (() => {
              // resolve actual image URL for local assets
              let zoomImgUrl = selectedImage;
              if (selectedImage && !selectedImage.startsWith('http')) {
                const match = Object.entries(images).find(([key]) => key.endsWith('/' + selectedImage));
                if (match) zoomImgUrl = match[1];
              }
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: Math.max(0, Math.min(zoomPos.x - 60, (imgRef.current?.width || 300) - 120)),
                    top: Math.max(0, Math.min(zoomPos.y - 60, (imgRef.current?.height || 300) - 120)),
                    width: 120,
                    height: 120,
                    border: '2px solid #7c5a3a',
                    borderRadius: 8,
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px #0003',
                    background: '#fff',
                    zIndex: 10,
                    pointerEvents: 'none',
                  }}
                >
                  <div
                    style={{
                      width: 240,
                      height: 240,
                      backgroundImage: `url(${zoomImgUrl})`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: `-${Math.max(0, Math.min(zoomPos.x - 60, (imgRef.current?.width || 300) - 120))*2}px -${Math.max(0, Math.min(zoomPos.y - 60, (imgRef.current?.height || 300) - 120))*2}px`,
                      backgroundSize: `${(imgRef.current?.width || 300)*2}px ${(imgRef.current?.height || 300)*2}px`,
                      filter: 'contrast(1.1) saturate(1.1)',
                      imageRendering: 'auto',
                    }}
                  />
                </div>
              );
            })()}
          </div>
          {/* Thumbnails: below main image on mobile, left on desktop (handled by CSS) */}
          <div className="product-images">
            {galleryImages.map((img, index) => (
              <ProductImage
                key={index}
                src={img}
                alt={`${product.name} ${index}`}
                className={`thumb-image${selectedImage === img ? ' selected' : ''}`}
                onClick={() => setSelectedImage(img)}
              />
            ))}
          </div>
        </div>

        {/* Right product details */}
        <div className="product-details">
          <h2>{product.name}</h2>
          <span className="brand">{product.brand}</span>
          <div style={{ margin: '6px 0 8px 0' }}>
            {/* Pass static avg/count or calculate from allReviews if desired */}
            <ProductRating2 avg={0} count={0} />
          </div>
          <div>
            <span className="price">₹{product.price}</span>
            <span className="discount">₹{product.originalPrice}</span>
          </div>
          {product.stock === 0 && (
            <div className="out-of-stock-badge" style={{position:'static',margin:'10px 0 0 0',display:'inline-block',background:'#b71c1c',color:'#fff',fontWeight:700,fontSize:'1.1em',padding:'4px 14px',borderRadius:'8px',letterSpacing:'0.5px',boxShadow:'0 2px 8px #bcae9e33',zIndex:2,textAlign:'center'}}>Out of Stock</div>
          )}
          <div className="buttons">
            <button onClick={() => onAddToCart(product)} disabled={product.stock === 0} style={product.stock === 0 ? {opacity:0.6, cursor:'not-allowed'} : {}}>Add to Cart</button>
            <button onClick={() => onAddToWishlist(product)} disabled={product.stock === 0} style={product.stock === 0 ? {opacity:0.6, cursor:'not-allowed'} : {}}>Add to Wishlist</button>
          </div>
          <div className="description">
            <h4 style={{ fontWeight: 'bold', fontSize: '1.25em', marginBottom: '0.3em' }}>Description</h4>
            <p>{product.description}</p>
          </div>
        </div>
      </div>

      {/* Collapsible Info Sections */}
      <div className="product-info-sections">
        {/* How To Use */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('how')}>
            <span>How To Use?</span>
            <span className="icon">{openSections.how ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.how && (
            <div className="info-content">
              <ol className="how-steps">
                <li><b>Step 1</b> - Add 2 gms of Coffee Powder to 180 ml of Hot/Cold Milk.</li>
                <li><b>Step 2</b> - Add sugar as per your taste.</li>
                <li><b>Step 3</b> - Blend for Frothy Cold Coffee/ Stir for Delicious Hot Coffee!</li>
                <li><b>Step 4</b> - Voila! Your Instant Coffee is ready.</li>
              </ol>
            </div>
          )}
        </div>
        {/* What's Inside */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('inside')}>
            <span>What's Inside?</span>
            <span className="icon">{openSections.inside ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.inside && (
            <div className="info-content">
              <p><b>100% pure instant coffee.</b></p>
              <p>But that's only part of the story.</p>
              <p>Our coffee is made from the finest Arabica and Robusta beans, carefully selected from high-altitude farms. Each bean is harvested with care and roasted to a perfect medium-dark, bringing out its rich, complex flavor.</p>
              <p>We then use a specialized process to crystallize the brew, preserving the full aroma and taste of a freshly made cup. This ensures that every granule in this jar holds the promise of an exceptional coffee experience.</p>
              <p>So, when you open this jar, you're not just getting instant coffee. You're getting the result of passion and dedication, transforming simple beans into a moment of pure bliss. It’s a cup made with love, ready for you to enjoy.</p>
            </div>
          )}
        </div>
        {/* FAQs */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('faqs')}>
            <span>FAQs</span>
            <span className="icon">{openSections.faqs ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.faqs && (
            <div className="info-content faqs">
              <div className="faq-item"><b>What is the shelf life of your instant coffee?</b><br/>Our instant coffee has a best-by date of 24 months from the date of manufacture. However, for the freshest and most vibrant flavor, we recommend enjoying it within 12-18 months of opening, as long as it is stored in a cool, dry place with the lid tightly sealed. Proper storage is key to preserving the rich aroma and taste of every granule.</div>
              <div className="faq-item"><b>Can I add the coffee powder to hot/cold milk or water?</b><br/>Absolutely! Our instant coffee is crafted to be versatile and dissolves beautifully in both hot and cold liquids.<br/><br/>For a Hot Coffee: Simply add 1-2 teaspoons of coffee powder to a cup of hot water or hot milk, stir until dissolved, and enjoy.<br/><br/>For a Cold Coffee: First, dissolve the coffee powder in a small amount of hot water to create a concentrate. Then, add cold water or chilled milk and ice. Stir vigorously or blend for a perfect, refreshing iced coffee.<br/><br/>Feel free to experiment with the ratios to create your perfect cup, whether it's a bold black coffee or a creamy latte.</div>
              <div className="faq-item"><b>Which coffee beans are used to make Bold & Brew Instant Coffee?</b><br/>We believe in using the best ingredients to create an exceptional product. Our instant coffee is a carefully balanced blend of premium Arabica and Robusta beans. The Arabica beans provide a smooth, aromatic, and nuanced flavor profile, while the Robusta beans add a rich body and a delightful boldness to the blend. This combination ensures a well-rounded and satisfying coffee experience with every sip.</div>
            </div>
          )}
        </div>
        {/* Customer Reviews */}
        <div className="info-section">
          <div className="info-header" onClick={() => toggleSection('reviews')}>
            <span>Customer Reviews</span>
            <span className="icon">{openSections.reviews ? <FaMinus /> : <FaPlus />}</span>
          </div>
          {openSections.reviews && (
            <div className="info-content reviews">
              <CustomerReviewSummary
                reviews={allReviews}
                onWriteReview={() => setShowReviewDrawer(true)}
              />
            </div>
          )}
        </div>

        {/* Review Drawer/Modal */}
        {/* Review drawer disabled, no Firestore submission */}
        <CustomerReviewDrawer
          open={showReviewDrawer}
          onClose={() => setShowReviewDrawer(false)}
          onSubmit={({ name, email, rating, comment }) => {
            // Optionally add to local state
            setAllReviews(reviews => [
              ...reviews,
              {
                id: Date.now(),
                productId: product.id,
                userName: name,
                userEmail: email,
                rating,
                review: comment,
                createdAt: new Date().toISOString(),
              },
            ]);
            setShowReviewDrawer(false);
          }}
        />

        {/* Show all reviews below the drawer */}
        <CustomerReviewList reviews={allReviews} />
      </div>
    </>
  );
}

export default ProductLanding;
