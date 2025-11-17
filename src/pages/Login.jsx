console.log('Login component loaded');
import { useState, useEffect } from 'react';
import { auth, googleProvider } from '../firebase';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithPopup, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { getAuthErrorMessage, isPopupError } from '../utils/authErrorHandler';
import './Login.css';

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    // Handle redirect result for Google Auth fallback
    const handleRedirectResult = async () => {
      try {
        const { getRedirectResult } = await import('firebase/auth');
        const result = await getRedirectResult(auth);
        if (result) {
          // User signed in via redirect
          navigate("/");
        }
      } catch (err) {
        if (err.code !== 'auth/null-user') {
          console.error('Redirect result error:', err);
          setError(getAuthErrorMessage(err));
        }
      }
    };
    
    handleRedirectResult();
    return () => unsubscribe();
  }, [navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    try {
      // Try popup first
      await signInWithPopup(auth, googleProvider);
      navigate("/");
    } catch (err) {
      console.error('Google sign-in error:', err);
      
      // Check if it's a popup blocked error or similar
      if (isPopupError(err)) {
        try {
          // Fallback to redirect method
          const { signInWithRedirect, getRedirectResult } = await import('firebase/auth');
          await signInWithRedirect(auth, googleProvider);
        } catch (redirectErr) {
          console.error('Redirect sign-in also failed:', redirectErr);
          setError(getAuthErrorMessage(redirectErr));
        }
      } else {
        setError(getAuthErrorMessage(err));
      }
    }
  };

  return (
    <div className="login-bg">
      <div className="login-main-box">
        <div className="login-form-col">
          {user ? (
            <>
              <h2>Already Logged In</h2>
              <p>You are already logged in as <b>{user.email}</b>.</p>
              <button className="btn login-btn" onClick={async () => { await signOut(auth); setUser(null); }}>Sign Out</button>
            </>
          ) : (
            <>
              <h2>Login</h2>
              <p>If you have an account with us, please log in.</p>
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
              <button className="btn google-btn" onClick={handleGoogleLogin} type="button">
                <img src="https://developers.google.com/identity/images/g-logo.png" alt="Google logo" className="google-logo" />
                Sign in with Google
              </button>
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
            </>
          )}
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
