import React, { useState, useEffect } from "react";
import "./Home.css"; // We'll create this file for styling
import banner1 from "../assets/Banner1.jpeg";
import banner2 from "../assets/Banner2.jpeg";
import banner3 from "../assets/Banner3.jpeg";

const Home = () => {
  const banners = [banner1, banner2, banner3];
  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-slide every 3 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === banners.length - 1 ? 0 : prevIndex + 1
      );
    }, 3000);
    return () => clearInterval(interval);
  }, [banners.length]);

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
            <img src={img} alt={`Banner ${index + 1}`} />
          </div>
        ))}
      </div>

      {/* Featured Section */}
      
    </div>
  );
};

export default Home;
