
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Dummy login handler
  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }
    setError("");
    // Simulate login success
    navigate("/");
  };

  return (
    <div className="login-bg">
      <div className="login-main-box">
        <div className="login-form-col">
          <h2>Login</h2>
          <p>This is a demo login form. No authentication is performed.</p>
          <form onSubmit={handleEmailLogin} autoComplete="on">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="input"
              autoComplete="email"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="input"
              autoComplete="current-password"
              required
            />
            <button className="btn login-btn" type="submit">Sign In</button>
          </form>
          <div>
            <button
              type="button"
              className="forgot-link"
              style={{ background: 'none', border: 'none', color: '#1976d2', textDecoration: 'underline', cursor: 'pointer', fontSize: '1rem', marginTop: 8, display: 'inline-block', padding: 0 }}
              onClick={() => navigate('/forgot-password')}
            >
              Forgot your password?
            </button>
          </div>
          {error && <div className="login-error">{error}</div>}
        </div>
        <div className="login-register-col">
          <h2>New Customer?</h2>
          <p>Registering for this site allows you to access your order status and history. We’ll get a new account set up for you in no time.</p>
          <button className="btn register-btn" onClick={() => navigate('/register')}>Create an Account</button>
        </div>
      </div>
    </div>
  );
}

export default Login;
