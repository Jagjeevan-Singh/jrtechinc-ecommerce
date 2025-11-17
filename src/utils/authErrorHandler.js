// src/utils/authErrorHandler.js

/**
 * Maps Firebase Auth error codes to user-friendly messages
 */
export const getAuthErrorMessage = (error) => {
  const errorCode = error?.code;
  
  switch (errorCode) {
    case 'auth/popup-blocked':
      return 'Please allow popups for this site and try again, or try a different browser.';
    
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open. Please close it and try again.';
    
    case 'auth/network-request-failed':
      return 'Network error. Please check your internet connection and try again.';
    
    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';
    
    case 'auth/user-not-found':
      return 'No account found with this email address.';
    
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    
    case 'auth/operation-not-allowed':
      return 'This sign-in method is not enabled. Please contact support.';
    
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email but different sign-in method.';
    
    default:
      // Check for common error message patterns
      const message = error?.message || '';
      
      if (message.includes('popup') || message.includes('channel')) {
        return 'Popup blocked or communication issue. Please allow popups and try again.';
      }
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'Network error. Please check your connection and try again.';
      }
      
      return message || 'Authentication failed. Please try again.';
  }
};

/**
 * Checks if the error is related to popup issues
 */
export const isPopupError = (error) => {
  const errorCode = error?.code;
  const message = error?.message || '';
  
  return [
    'auth/popup-blocked',
    'auth/popup-closed-by-user',
    'auth/cancelled-popup-request'
  ].includes(errorCode) || 
  message.includes('popup') || 
  message.includes('channel') ||
  message.includes('listener indicated an asynchronous response');
};