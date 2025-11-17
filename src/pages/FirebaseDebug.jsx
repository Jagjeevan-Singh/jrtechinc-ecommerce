// Debug component to check Firebase configuration
import React from 'react';
import { auth } from '../firebase';

const FirebaseDebug = () => {
  const envVars = {
    'VITE_FIREBASE_API_KEY': import.meta.env.VITE_FIREBASE_API_KEY ? '✅ Set (hidden)' : '❌ Missing',
    'VITE_FIREBASE_AUTH_DOMAIN': import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '❌ Missing',
    'VITE_FIREBASE_PROJECT_ID': import.meta.env.VITE_FIREBASE_PROJECT_ID || '❌ Missing',
    'VITE_FIREBASE_STORAGE_BUCKET': import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '❌ Missing',
    'VITE_FIREBASE_MESSAGING_SENDER_ID': import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '❌ Missing',
    'VITE_FIREBASE_APP_ID': import.meta.env.VITE_FIREBASE_APP_ID || '❌ Missing',
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', maxWidth: '800px', margin: '0 auto' }}>
      <h1>🔍 Firebase Configuration Debug</h1>
      
      <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Current Environment</h2>
        <p><strong>Window Location:</strong> {window.location.href}</p>
        <p><strong>Hostname:</strong> {window.location.hostname}</p>
        <p><strong>Protocol:</strong> {window.location.protocol}</p>
      </div>

      <div style={{ background: '#e3f2fd', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Firebase Configuration</h2>
        {Object.entries(envVars).map(([key, value]) => (
          <p key={key}><strong>{key}:</strong> {value}</p>
        ))}
      </div>

      <div style={{ background: '#fff3e0', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h2>Auth Configuration</h2>
        <p><strong>Auth Instance:</strong> {auth ? '✅ Initialized' : '❌ Not initialized'}</p>
        <p><strong>Current User:</strong> {auth.currentUser ? `✅ ${auth.currentUser.email}` : '❌ Not signed in'}</p>
      </div>

      <div style={{ background: '#ffebee', padding: '15px', borderRadius: '8px' }}>
        <h2>⚠️ Required Actions</h2>
        <ol>
          <li>
            <strong>Firebase Console Check:</strong> Go to{' '}
            <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer">
              Firebase Console
            </a>
            {' '}→ Authentication → Settings → Authorized domains
          </li>
          <li>
            <strong>Verify these domains are listed:</strong>
            <ul>
              <li>✓ {window.location.hostname}</li>
              <li>✓ localhost</li>
              <li>✓ {import.meta.env.VITE_FIREBASE_AUTH_DOMAIN}</li>
            </ul>
          </li>
          <li>
            <strong>Vercel Environment Variables:</strong> If on Vercel, ensure ALL Firebase env vars are set in
            Vercel Dashboard → Settings → Environment Variables
          </li>
          <li>
            <strong>After changes:</strong> Redeploy and clear browser cache
          </li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', textAlign: 'center' }}>
        <button 
          onClick={() => window.location.href = '/login'}
          style={{ 
            padding: '10px 20px', 
            background: '#4285f4', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px'
          }}
        >
          Go to Login Page
        </button>
      </div>
    </div>
  );
};

export default FirebaseDebug;