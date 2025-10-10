import React from "react";
import "./Account.css";

const Account = () => {
  // Example user data
  const user = {
    name: "John Doe",
    email: "johndoe@example.com",
    joinDate: "January 2024"
  };

  const orderHistory = [
    { id: 1, product: "Microfiber Towel", date: "12 July 2024", price: 199 },
    { id: 2, product: "Hand Exercise Tool", date: "15 August 2024", price: 449 }
  ];

  return (
    <div className="account-container">
      <h1>My Account</h1>
      <div className="account-details">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Member Since:</strong> {user.joinDate}</p>
      </div>

      <h2>Order History</h2>
      {orderHistory.length === 0 ? (
        <p>No orders yet.</p>
      ) : (
        <table className="order-table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Date</th>
              <th>Price (₹)</th>
            </tr>
          </thead>
          <tbody>
            {orderHistory.map((order) => (
              <tr key={order.id}>
                <td>{order.product}</td>
                <td>{order.date}</td>
                <td>{order.price}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Account;
