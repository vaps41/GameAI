/**
 * GamePrice AI - Authentication Module
 * Firebase Auth functions for user management
 */

const Auth = {
  // Current user state
  currentUser: null,

  // Auth state listeners
  listeners: [],

  // Initialize auth state listener
  init: function () {
    if (!window.firebaseAuth) {
      console.error('Firebase Auth not initialized');
      return;
    }

    window.firebaseAuth.onAuthStateChanged(async (user) => {
      this.currentUser = user;

      if (user) {
        console.log('User signed in:', user.email);
        // Ensure user document exists
        await this.ensureUserDocument(user);
      } else {
        console.log('User signed out');
      }

      // Notify all listeners
      this.listeners.forEach(callback => callback(user));

      // Update UI based on auth state
      this.updateUI(user);
    });
  },

  // Subscribe to auth state changes
  onAuthStateChanged: function (callback) {
    this.listeners.push(callback);
    // Call immediately with current state
    if (this.currentUser !== undefined) {
      callback(this.currentUser);
    }
  },

  // Ensure user document exists in LocalStorage
  ensureUserDocument: async function (user) {
    if (!user || !window.userDoc) return;

    try {
      const userData = await window.userDoc.get(user.uid);

      // If user data doesn't exist, we create the defaults
      if (!userData) {
        await window.userDoc.set(user.uid, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || null,
          photoURL: user.photoURL || null,
          plan: 'free',
          monthlyUsage: {
            count: 0,
            month: window.usageTracker ? window.usageTracker.getMonthKey() : new Date().toISOString().slice(0, 7)
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log('Created user document for:', user.email);
      }
    } catch (error) {
      console.error('Error ensuring user document:', error);
    }
  },

  // Sign up with email and password
  signUp: async function (email, password) {
    if (!window.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const result = await window.firebaseAuth.createUserWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Sign up error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Sign in with email and password
  signIn: async function (email, password) {
    if (!window.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const result = await window.firebaseAuth.signInWithEmailAndPassword(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Sign in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Sign in with Google
  signInWithGoogle: async function () {
    if (!window.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');

      const result = await window.firebaseAuth.signInWithPopup(provider);
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Google sign in error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Sign out
  signOut: async function () {
    if (!window.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await window.firebaseAuth.signOut();
      return { success: true };
    } catch (error) {
      console.error('Sign out error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Send password reset email
  resetPassword: async function (email) {
    if (!window.firebaseAuth) {
      throw new Error('Firebase Auth not initialized');
    }

    try {
      await window.firebaseAuth.sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      console.error('Password reset error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Update user profile
  updateProfile: async function (data) {
    if (!window.firebaseAuth || !this.currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      await this.currentUser.updateProfile(data);

      // Update Firestore document
      if (window.userDoc) {
        await window.userDoc.update(this.currentUser.uid, {
          displayName: data.displayName || null,
          photoURL: data.photoURL || null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return {
        success: false,
        error: this.getErrorMessage(error.code)
      };
    }
  },

  // Get current user
  getCurrentUser: function () {
    return this.currentUser;
  },

  // Get ID token
  getIdToken: async function (forceRefresh = false) {
    if (!this.currentUser) return null;
    try {
      return await this.currentUser.getIdToken(forceRefresh);
    } catch (error) {
      console.error('Get ID token error:', error);
      return null;
    }
  },

  // Check if user is authenticated
  isAuthenticated: function () {
    return !!this.currentUser;
  },

  // Require authentication (redirect if not logged in)
  requireAuth: function (redirectUrl = '/index.html') {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (this.isAuthenticated()) {
          resolve(true);
        } else {
          // Check if we're still waiting for auth state
          if (this.currentUser === null && window.firebaseAuth) {
            // Wait a bit for auth state to resolve
            setTimeout(checkAuth, 100);
          } else {
            window.location.href = redirectUrl;
            resolve(false);
          }
        }
      };
      checkAuth();
    });
  },

  // Redirect if already authenticated
  redirectIfAuthenticated: function (redirectUrl = '/dashboard.html') {
    return new Promise((resolve) => {
      const checkAuth = () => {
        if (this.isAuthenticated()) {
          window.location.href = redirectUrl;
          resolve(false);
        } else {
          // Check if we're still waiting for auth state
          if (this.currentUser === null && window.firebaseAuth) {
            // Wait a bit for auth state to resolve
            setTimeout(checkAuth, 100);
          } else {
            resolve(true);
          }
        }
      };
      checkAuth();
    });
  },

  // Update UI based on auth state
  updateUI: function (user) {
    // Update navigation
    const authLinks = document.querySelectorAll('.auth-link');
    const guestLinks = document.querySelectorAll('.guest-link');
    const userNameElements = document.querySelectorAll('.user-name');
    const userEmailElements = document.querySelectorAll('.user-email');

    if (user) {
      // Show auth-only elements
      authLinks.forEach(el => el.classList.remove('hidden'));
      guestLinks.forEach(el => el.classList.add('hidden'));

      // Update user info
      userNameElements.forEach(el => {
        el.textContent = user.displayName || user.email.split('@')[0];
      });
      userEmailElements.forEach(el => {
        el.textContent = user.email;
      });
    } else {
      // Show guest-only elements
      authLinks.forEach(el => el.classList.add('hidden'));
      guestLinks.forEach(el => el.classList.remove('hidden'));
    }
  },

  // Get human-readable error message
  getErrorMessage: function (code) {
    const messages = {
      'auth/email-already-in-use': 'This email is already registered. Please sign in instead.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/user-not-found': 'No account found with this email. Please sign up.',
      'auth/wrong-password': 'Incorrect password. Please try again.',
      'auth/invalid-credential': 'Invalid email or password. Please try again.',
      'auth/popup-closed-by-user': 'Sign in was cancelled. Please try again.',
      'auth/popup-blocked': 'Pop-up was blocked. Please allow pop-ups for this site.',
      'auth/account-exists-with-different-credential': 'An account already exists with this email using a different sign-in method.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/requires-recent-login': 'Please sign in again to complete this action.',
      'default': 'An error occurred. Please try again.'
    };

    return messages[code] || messages['default'];
  }
};

// Form validation helpers
const FormValidator = {
  // Validate email
  isValidEmail: function (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  // Validate password
  isValidPassword: function (password) {
    return password && password.length >= 6;
  },

  // Validate URL
  isValidUrl: function (url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // Show field error
  showError: function (inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    if (!formGroup) return;

    // Remove existing error
    this.clearError(inputElement);

    // Add error styling
    inputElement.classList.add('error');

    // Create error message
    const errorElement = document.createElement('span');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.style.cssText = 'color: var(--accent-danger); font-size: 0.875rem; margin-top: 0.25rem; display: block;';

    formGroup.appendChild(errorElement);
  },

  // Clear field error
  clearError: function (inputElement) {
    const formGroup = inputElement.closest('.form-group');
    if (!formGroup) return;

    inputElement.classList.remove('error');
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
      errorElement.remove();
    }
  },

  // Clear all errors in form
  clearAllErrors: function (formElement) {
    formElement.querySelectorAll('.error').forEach(el => {
      el.classList.remove('error');
    });
    formElement.querySelectorAll('.error-message').forEach(el => {
      el.remove();
    });
  }
};

// Test Account Configuration
const TEST_ACCOUNT = {
  email: 'test@gameprice.ai',
  password: 'Test123456',
  displayName: 'Test User'
};

// Test Account Helper
const TestAccount = {
  // Login with test account
  login: async function () {
    if (!window.firebaseAuth) {
      console.error('Firebase Auth not initialized');
      return { success: false, error: 'Authentication not available' };
    }

    try {
      // Try to sign in with test credentials
      const result = await window.firebaseAuth.signInWithEmailAndPassword(
        TEST_ACCOUNT.email,
        TEST_ACCOUNT.password
      );

      console.log('Test account logged in successfully');
      return { success: true, user: result.user };
    } catch (error) {
      // If user doesn't exist, create it
      if (error.code === 'auth/user-not-found') {
        console.log('Creating test account...');
        return await this.create();
      }

      console.error('Test login error:', error);
      return {
        success: false,
        error: Auth.getErrorMessage(error.code)
      };
    }
  },

  // Create test account
  create: async function () {
    if (!window.firebaseAuth) {
      return { success: false, error: 'Authentication not available' };
    }

    try {
      const result = await window.firebaseAuth.createUserWithEmailAndPassword(
        TEST_ACCOUNT.email,
        TEST_ACCOUNT.password
      );

      // Update profile
      await result.user.updateProfile({
        displayName: TEST_ACCOUNT.displayName
      });

      // Create user document in Firestore
      if (window.userDoc) {
        await window.userDoc.set(result.user.uid, {
          uid: result.user.uid,
          email: TEST_ACCOUNT.email,
          displayName: TEST_ACCOUNT.displayName,
          plan: 'diamond', // Give test user Diamond plan for full access
          monthlyUsage: {
            count: 0,
            month: new Date().toISOString().slice(0, 7)
          },
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }

      console.log('Test account created successfully');
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Test account creation error:', error);
      return {
        success: false,
        error: Auth.getErrorMessage(error.code)
      };
    }
  },

  // Auto-fill test credentials
  fillCredentials: function () {
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    if (emailInput) emailInput.value = TEST_ACCOUNT.email;
    if (passwordInput) passwordInput.value = TEST_ACCOUNT.password;
  }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
  Auth.init();

  // Setup test login button
  const testLoginBtn = document.getElementById('test-login-btn');
  if (testLoginBtn) {
    testLoginBtn.addEventListener('click', async () => {
      // Show loading state
      testLoginBtn.disabled = true;
      testLoginBtn.innerHTML = '<span class="spinner" style="width: 16px; height: 16px;"></span> Logging in...';

      const result = await TestAccount.login();

      if (result.success) {
        window.location.href = '/dashboard.html';
      } else {
        // Show error
        const errorElement = document.getElementById('auth-error');
        if (errorElement) {
          errorElement.textContent = result.error;
          errorElement.classList.remove('hidden');
        }

        // Reset button
        testLoginBtn.disabled = false;
        testLoginBtn.innerHTML = '⚡ Quick Login with Test Account';
      }
    });
  }
});

// Export for global access
window.Auth = Auth;
window.FormValidator = FormValidator;
window.TestAccount = TestAccount;
window.TEST_ACCOUNT = TEST_ACCOUNT;
