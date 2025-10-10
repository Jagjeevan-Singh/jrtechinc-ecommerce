import React from "react";
import "./Products.css";
import towelImg from "../assets/microfiber-towel.jpg";
import handExerciseImg from "../assets/hand-exercise.jpg";
import { Link } from "react-router-dom";

const Products = () => {
  const products = [
    {
      id: 1,
      name: "JR Ultimate Finger Exerciser & Hand Strengthener – Heavy Resistance Grip Ball for Men & Women – Finger Strength Trainer for Workout, Rehab, Stress Relief – Durable ABS Material (Multicolor, Heavier)",
      mrp: 999,
      price: 359,
      description: `🔥 Designed for Real Strength Training: The JR Ultimate Finger Exerciser Strength Trainer is engineered for serious finger and hand strengthening. Its ergonomic ball design ensures just the right amount of resistance to help build finger endurance, grip power, and hand flexibility without discomfort.\n\n🎯 Individually Adjustable Finger Tension: Featuring customized five-finger plungers, each finger can be trained individually. The adjustable tension system allows you to increase resistance per finger, making it perfect for progressive training. The silicone rubber pads provide a comfortable grip on both the palm and fingertips.\n\n💪 Improves Strength, Dexterity & Mobility: Ideal for those recovering from injury, dealing with arthritis, or simply wanting to enhance grip strength. The smooth, pain-free resistance makes it suitable for daily workouts and rehab therapy.\n\n⚙️ Heavy Resistance (Black Version) for Advanced Users: This black variant provides higher resistance—perfect for advanced users who need intense finger and grip workouts. Crafted from durable ABS material (Acrylonitrile Butadiene Styrene) to withstand daily usage.\n\n🎸 Versatile Use for Athletes, Musicians & Professionals: Whether you're a guitarist, pianist, rock climber, office worker, artist, or athlete, this hand strengthener helps enhance precision, stamina, and control. A perfect addition to your daily routine or physical therapy equipment.\n\n⚠️ IMPORTANT NOTE: This is not a toy or a light-use product. It’s designed for users who already have basic hand strength. If you lack strength or are looking for a soft grip exerciser, this is not recommended. To see real results, you must use it consistently and with dedication. Strength and stamina require effort—there are no shortcuts.`,
      image: handExerciseImg
    },
    {
      id: 2,
      name: "JR Micro Fiber Cloth for Car Cleaning - Ultra Absorbent Microfiber Cleaning Cloth - Soft & Scratch-Free Car Cleaning Clothes - Ideal Car Cleaning Accessories - Machine Washable",
      mrp: 499,
      price: 149,
      description: `Superior Absorbency for Effortless Cleaning: Our micro fiber cloth for car cleaning offers exceptional absorption, soaking up spills and debris with ease, saving you time and effort during your car maintenance routine. Its ultra-soft texture ensures a scratch-free finish, enhancing your vehicle's appearance, making it the ideal choice for perfectionists who want their car to shine immaculately after each wash.\n\nDurable and Long-lasting Design: This microfiber cloth for car cleaning stands up to repeated uses and washes, maintaining its form and effectiveness. It remains an essential part of your car cleaning accessories, ensuring longevity and durability with each use. Reduce replacement costs and environmental impact by investing in a cloth built to last, meeting the demands of frequent car enthusiasts and professionals alike.\n\nTime-Saving Quick Dry Technology: Experience a hassle-free drying process with our car towel for cleaning, equipped with enhanced quick-drying properties. Speed up your cleaning routine without leaving a trail of lint or residue behind. Ideal for busy lifestyles, it is engineered to keep up with fast-paced schedules, ensuring your vehicle looks pristine in no time.\n\nMulti-Purpose Cleaning Efficiency: Not just limited to your car, this versatile microfiber cleaning cloth is perfect for a range of tasks—whether it's detailing the interior, cleaning windows for a streak-free finish, or polishing surfaces at home. Its adaptability ensures you get maximum utility, seamlessly fitting into your cleaning toolkit for all-around household effectiveness.\n\nGentle and Safe for All Surfaces: Our car cleaning clothes ensure even the most delicate surfaces of your vehicle are treated gently, preventing scratching or marring. Perfect for maintaining the integrity of your car's paint and interior surfaces, it caters to car owners who value quality and care, delivering unmatched cleaning performance for every inch of your car.`,
      image: towelImg
    }
  ];

  const handleAddToCart = (product) => {
    alert(`Added ${product.name} to cart!`);
    // TODO: connect to cart context or Firebase later
  };

  const handleAddToWishlist = (product) => {
    alert(`Added ${product.name} to wishlist!`);
    // TODO: connect to wishlist context or Firebase later
  };

  return (
    <div className="products-container">
      <h1>Our Products</h1>
      <div className="products-grid">
        {products.map((product) => (
          <Link to={`/products/${product.id}`} state={{ product }} className="product-card-link" key={product.id} style={{ textDecoration: 'none', color: 'inherit' }}>
            <div className="product-card">
              <img src={product.image} alt={product.name} />
              <h2>{product.name}</h2>
              <p className="price">₹{product.price}</p>
              <p className="description">{product.description}</p>
              <div className="product-buttons">
                <button onClick={e => { e.preventDefault(); handleAddToCart(product); }}>Add to Cart</button>
                <button className="wishlist-btn" onClick={e => { e.preventDefault(); handleAddToWishlist(product); }}>
                  Add to Wishlist
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Products;