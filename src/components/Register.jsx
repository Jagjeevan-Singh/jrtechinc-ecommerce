import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// NOTE: Assuming Header is rendered by Layout, this import is likely redundant:
// import Header from './Header';
import './Register.css'; // Use the dedicated stylesheet

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // TODO: Implement registration logic
    alert("Registration logic goes here");
  };

  return (
    // Use a clean wrapper for the whole page content
    <div className="auth-container"> 
      
      {/* Main Form Card */}
      <div className="register-main-box"> 
        <h2 className="register-title">Create Your Account</h2>
        <p className="register-subtitle">Access your history, saved items, and personalized offers.</p>
        
        <form onSubmit={handleRegister} autoComplete="on" className="register-form-group">
          {/* Input fields are wrapped in a general form group */}
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="input-field" // Unified input class
            autoComplete="email"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="input-field" // Unified input class
            autoComplete="new-password"
            required
          />
          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="input-field" // Unified input class
            autoComplete="new-password"
            required
          />
          <button type="submit" className="btn primary-btn register-btn-submit">
            Register
          </button>
        </form>
        
        <button className="register-back-btn secondary-btn" onClick={() => navigate("/login")}>
          Back to Sign In
        </button>
      </div>
    </div>
  );
}