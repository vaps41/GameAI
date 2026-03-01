/**
 * GamePrice AI - Firebase Configuration
 * Firebase SDK initialization and core services
 */

// Firebase config - Dynamically loading secure keys
const firebaseConfig = {
  apiKey: window.ENV_CONFIG?.FIREBASE_API_KEY || "AIzaSyATfwy2bOrs1jT5SwJLntE48lr_V7MvNh0",
  authDomain: "gameai-bb8e8.firebaseapp.com",
  projectId: "gameai-bb8e8",
  storageBucket: "gameai-bb8e8.firebasestorage.app",
  messagingSenderId: "91462879285",
  appId: "1:91462879285:web:8633fa1ad2f13b2253097c"
};

// Initialize Firebase
let app;
let auth;
let db;

try {
  // Check if Firebase is already initialized
  if (!firebase.apps.length) {
    app = firebase.initializeApp(firebaseConfig);
  } else {
    app = firebase.app();
  }

  auth = firebase.auth();
  db = firebase.firestore();

  console.log('Firebase initialized successfully');
} catch (error) {
  console.error('Firebase initialization error:', error);
}

// We are no longer using Firestore for storing game arrays and user data to avoid DB costs/exposure.
// Data will be managed via localStorage or purely via memory.
// db has been initialized, but we will not use it for collections.
const collections = {
  users: null,
  favorites: null,
  analysisHistory: null
};

// Plan configuration
const PLANS = {
  free: {
    name: 'Free',
    monthlyLimit: 5,
    canFavorite: false,
    showBestTimeToBuy: false,
    price: 0
  },
  bronze: {
    name: 'Bronze',
    monthlyLimit: 50,
    canFavorite: true,
    showBestTimeToBuy: false,
    price: 6.25
  },
  silver: {
    name: 'Silver',
    monthlyLimit: 200,
    canFavorite: true,
    showBestTimeToBuy: true,
    price: 10.23
  },
  gold: {
    name: 'Gold',
    monthlyLimit: 500,
    canFavorite: true,
    showBestTimeToBuy: true,
    price: 35.27
  },
  diamond: {
    name: 'Diamond',
    monthlyLimit: Infinity,
    canFavorite: true,
    showBestTimeToBuy: true,
    price: 52.15
  }
};

// User document helper functions (mocked using localStorage)
const userDoc = {
  get: async (uid) => {
    const data = localStorage.getItem(`user_${uid}`);
    return data ? JSON.parse(data) : null;
  },
  set: async (uid, data) => {
    localStorage.setItem(`user_${uid}`, JSON.stringify(data));
    return true;
  },
  update: async (uid, data) => {
    const current = await userDoc.get(uid) || {};
    localStorage.setItem(`user_${uid}`, JSON.stringify({ ...current, ...data }));
    return true;
  }
};

// Monthly usage tracker bounds
const usageTracker = {
  getMonthKey: () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  },
  getMonthlyUsage: async (uid) => {
    try {
      const userData = await userDoc.get(uid);
      if (!userData || !userData.monthlyUsage) {
        return { count: 0, month: usageTracker.getMonthKey() };
      }
      const currentMonth = usageTracker.getMonthKey();
      if (userData.monthlyUsage.month !== currentMonth) {
        return { count: 0, month: currentMonth };
      }
      return userData.monthlyUsage;
    } catch (error) {
      console.error('Error getting monthly usage:', error);
      return { count: 0, month: usageTracker.getMonthKey() };
    }
  },
  incrementUsage: async (uid) => {
    try {
      const currentMonth = usageTracker.getMonthKey();
      const userData = await userDoc.get(uid);

      let newCount = 1;
      if (userData && userData.monthlyUsage && userData.monthlyUsage.month === currentMonth) {
        newCount = userData.monthlyUsage.count + 1;
      }

      await userDoc.update(uid, {
        monthlyUsage: {
          count: newCount,
          month: currentMonth
        }
      });
      return true;
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return false;
    }
  },

  // Check if user can perform analysis
  canAnalyze: async (uid) => {
    if (!uid) return false;
    try {
      const userData = await userDoc.get(uid);
      const plan = userData?.plan || 'free';
      const planConfig = PLANS[plan];

      // Diamond plan is unlimited
      if (plan === 'diamond') {
        return true;
      }

      // Check monthly limit
      const usage = await usageTracker.getMonthlyUsage(uid);
      return usage.count < planConfig.monthlyLimit;
    } catch (error) {
      console.error('Error checking can analyze:', error);
      return false;
    }
  },

  // Get remaining analyses for current month
  getRemaining: async (uid) => {
    if (!uid) return 0;
    try {
      const userData = await userDoc.get(uid);
      const plan = userData?.plan || 'free';
      const planConfig = PLANS[plan];

      // Diamond plan is unlimited
      if (plan === 'diamond') {
        return Infinity;
      }

      const usage = await usageTracker.getMonthlyUsage(uid);
      return Math.max(0, planConfig.monthlyLimit - usage.count);
    } catch (error) {
      console.error('Error getting remaining:', error);
      return 0;
    }
  },

  // Get plan limit
  getPlanLimit: (plan) => {
    return PLANS[plan]?.monthlyLimit || 5;
  }
};

// Subscription management
const subscriptionManager = {
  updateSubscription: async (uid, plan, stripeData = {}) => {
    const updateData = { plan: plan };
    if (stripeData.customerId) updateData.stripeCustomerId = stripeData.customerId;
    if (stripeData.subscriptionId) updateData.stripeSubscriptionId = stripeData.subscriptionId;
    await userDoc.update(uid, updateData);
    return true;
  },
  getSubscription: async (uid) => {
    const userData = await userDoc.get(uid);
    return { plan: userData?.plan || 'free' };
  },

  // Get plan features
  getPlanFeatures: (plan) => {
    return PLANS[plan] || PLANS.free;
  },

  // Check if user can favorite
  canFavorite: async (uid) => {
    if (!uid) return false;
    try {
      const userData = await userDoc.get(uid);
      const plan = userData?.plan || 'free';
      return PLANS[plan]?.canFavorite || false;
    } catch (error) {
      console.error('Error checking can favorite:', error);
      return false;
    }
  },

  // Check if user can see best time to buy
  canSeeBestTime: async (uid) => {
    if (!uid) return false;
    try {
      const userData = await userDoc.get(uid);
      const plan = userData?.plan || 'free';
      return PLANS[plan]?.showBestTimeToBuy || false;
    } catch (error) {
      console.error('Error checking can see best time:', error);
      return false;
    }
  }
};

// Favorites management (LocalStorage)
const favoritesManager = {
  add: async (uid, gameData) => {
    const list = await favoritesManager.getAll(uid);
    list.push({ ...gameData, addedAt: new Date().toISOString() });
    localStorage.setItem(`favorites_${uid}`, JSON.stringify(list));
    return true;
  },
  remove: async (uid, gameId) => {
    let list = await favoritesManager.getAll(uid);
    list = list.filter(g => (g.appId || g.title) !== gameId);
    localStorage.setItem(`favorites_${uid}`, JSON.stringify(list));
    return true;
  },
  getAll: async (uid) => {
    const data = localStorage.getItem(`favorites_${uid}`);
    return data ? JSON.parse(data) : [];
  },
  isFavorited: async (uid, gameId) => {
    const list = await favoritesManager.getAll(uid);
    return list.some(g => (g.appId || g.title) === gameId);
  }
};

// Analysis history management (LocalStorage)
const historyManager = {
  save: async (uid, analysisData) => {
    const list = await historyManager.getAll(uid);
    list.unshift({ ...analysisData, analyzedAt: new Date().toISOString() });
    localStorage.setItem(`history_${uid}`, JSON.stringify(list.slice(0, 50))); // Keep last 50
    return true;
  },
  getAll: async (uid, limit = 50) => {
    const data = localStorage.getItem(`history_${uid}`);
    return data ? JSON.parse(data).slice(0, limit) : [];
  },
  getRecent: async (uid, days = 30) => {
    const list = await historyManager.getAll(uid);
    return list; // Mock return
  },
  clear: async (uid) => {
    localStorage.removeItem(`history_${uid}`);
    return true;
  }
};

// Export for global access
window.firebaseApp = app;
window.firebaseAuth = auth;
window.firebaseDb = db;
window.userDoc = userDoc;
window.usageTracker = usageTracker;
window.subscriptionManager = subscriptionManager;
window.favoritesManager = favoritesManager;
window.historyManager = historyManager;
window.PLANS = PLANS;
