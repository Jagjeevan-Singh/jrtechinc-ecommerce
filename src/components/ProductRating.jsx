// import { useEffect, useState } from 'react';
import { FaStar } from 'react-icons/fa';

// Accept avg and count as props, fallback to 0 if not provided
function ProductRating({ avg = 0, count = 0 }) {
  const displayAvg = avg;
  const displayCount = count;
  return (
    <div className="product-rating" title={
      displayCount > 0
        ? `${displayAvg.toFixed(1)} out of 5 from ${displayCount} review${displayCount > 1 ? 's' : ''}`
        : 'No reviews yet'
    }>
      {[1,2,3,4,5].map(i => (
        <FaStar key={i} color={i <= Math.round(displayAvg) ? '#FFD700' : '#ccc'} style={{marginRight:2}} />
      ))}
      <span className="product-rating-value">{displayAvg.toFixed(1)}</span>
      <span className="product-rating-count">({displayCount})</span>
    </div>
  );
}

export default ProductRating;
