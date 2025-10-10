import React, { useState } from "react";
import "./Search.css";

const Search = ({ products }) => {
  const [query, setQuery] = useState("");

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="search-container">
      <h1>Search Products</h1>
      <input
        type="text"
        placeholder="Search here..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="search-input"
      />

      <div className="search-results">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((product, index) => (
            <div key={index} className="search-item">
              <img src={product.image} alt={product.name} />
              <h3>{product.name}</h3>
              <p>₹{product.price}</p>
            </div>
          ))
        ) : (
          <p>No matching products found.</p>
        )}
      </div>
    </div>
  );
};

export default Search;
