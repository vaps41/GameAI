/**
 * GamePrice AI - Core Application Module
 * Main application logic and GameHunter API integration
 */

// IsThereAnyDeal API Configuration
const ITAD_API = {
  baseUrl: 'https://api.isthereanydeal.com',
  // Key now loaded dynamically from server
  apiKey: window.ENV_CONFIG?.ITAD_API_KEY || '4dd38dc3e228c229cc98f26b4b02c71031160580',

  // Search for game
  searchGame: async function (query) {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/search/v1?key=${this.apiKey}&title=${encodeURIComponent(query)}&limit=10`
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (error) {
      console.error('ITAD Search Error:', error);
      return null;
    }
  },

  // Get game prices and history
  getGamePrices: async function (gameId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/games/prices/v2?key=${this.apiKey}&id=${gameId}`
      );
      if (!response.ok) throw new Error('Price fetch failed');
      return await response.json();
    } catch (error) {
      console.error('ITAD Prices Error:', error);
      return null;
    }
  },

  // Get game info and historical data
  getGameInfo: async function (gameIds) {
    try {
      const idsParam = Array.isArray(gameIds) ? gameIds.join(',') : gameIds;
      const response = await fetch(
        `${this.baseUrl}/games/info/v2?key=${this.apiKey}&id=${idsParam}`
      );
      if (!response.ok) throw new Error('Game info fetch failed');
      return await response.json();
    } catch (error) {
      console.error('ITAD Info Error:', error);
      return null;
    }
  },

  // Get historical low data
  getHistoricalLow: async function (gameIds) {
    try {
      const idsParam = Array.isArray(gameIds) ? gameIds.join(',') : gameIds;
      const response = await fetch(
        `${this.baseUrl}/games/history/v1?key=${this.apiKey}&id=${idsParam}`
      );
      if (!response.ok) throw new Error('History fetch failed');
      return await response.json();
    } catch (error) {
      console.error('ITAD History Error:', error);
      return null;
    }
  }
};

// CheapShark API (Free alternative for game deals)
const CHEAPSHARK_API = {
  baseUrl: 'https://www.cheapshark.com/api/1.0',
  _storesCache: null,

  // Search for games
  searchGames: async function (title) {
    try {
      const response = await fetch(
        `${this.baseUrl}/games?title=${encodeURIComponent(title)}&limit=10`
      );
      if (!response.ok) throw new Error('Search failed');
      return await response.json();
    } catch (error) {
      console.error('CheapShark Search Error:', error);
      return null;
    }
  },

  // Search for games by Steam ID
  searchGamesBySteamId: async function (steamAppId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/games?steamAppID=${steamAppId}`
      );
      if (!response.ok) throw new Error('Steam ID Search failed');
      return await response.json();
    } catch (error) {
      console.error('CheapShark Steam ID Search Error:', error);
      return null;
    }
  },

  // Get game details
  getDeals: async function (gameId) {
    try {
      const response = await fetch(
        `${this.baseUrl}/games?id=${gameId}`
      );
      if (!response.ok) throw new Error('Game fetch failed');
      return await response.json();
    } catch (error) {
      console.error('CheapShark Deals Error:', error);
      return null;
    }
  },

  // Get stores list
  getStores: async function () {
    if (this._storesCache) return this._storesCache;
    try {
      const response = await fetch(`${this.baseUrl}/stores`);
      if (!response.ok) throw new Error('Stores fetch failed');
      this._storesCache = await response.json();
      return this._storesCache;
    } catch (error) {
      console.error('CheapShark Stores Error:', error);
      return null;
    }
  }
};

// Free Games API (GamerPower)
const FREEGAMES_API = {
  baseUrl: '/api',

  // Get all free games
  getFreeGames: async function () {
    try {
      // Call our backend proxy to avoid any CORS issues from GamerPower
      const response = await fetch(`${this.baseUrl}/free-games`);
      if (!response.ok) throw new Error('Free games fetch failed');
      const data = await response.json();

      // Map GamerPower data to our internal format
      return data.map(game => ({
        id: game.id.toString(),
        title: game.title,
        description: game.short_description,
        image: game.thumbnail,
        platform: game.platforms, // e.g. "PC, Playstation 4"
        type: game.type, // e.g. "Game", "Loot"
        endDate: game.end_date !== "N/A" ? game.end_date : null,
        url: game.open_giveaway_url || game.gamerpower_url
      }));
    } catch (error) {
      console.error('Free Games API Error:', error);
      return null;
    }
  },

  // Get free games by platform
  getByPlatform: async function (platform) {
    try {
      const response = await fetch(`${this.baseUrl}/giveaways?platform=${platform}`);
      if (!response.ok) throw new Error('Platform fetch failed');
      const data = await response.json();
      return data.map(game => ({
        id: game.id.toString(),
        title: game.title,
        description: game.short_description,
        image: game.thumbnail,
        platform: game.platforms,
        type: game.type,
        endDate: game.end_date !== "N/A" ? game.end_date : null,
        url: game.open_giveaway_url || game.gamerpower_url
      }));
    } catch (error) {
      console.error('Free Games Platform Error:', error);
      return null;
    }
  },

  // Get free games by type (game, dlc, beta, etc)
  getByType: async function (type) {
    try {
      const response = await fetch(`${this.baseUrl}/giveaways?type=${type}`);
      if (!response.ok) throw new Error('Type fetch failed');
      const data = await response.json();
      return data.map(game => ({
        id: game.id.toString(),
        title: game.title,
        description: game.short_description,
        image: game.thumbnail,
        platform: game.platforms,
        type: game.type,
        endDate: game.end_date !== "N/A" ? game.end_date : null,
        url: game.open_giveaway_url || game.gamerpower_url
      }));
    } catch (error) {
      console.error('Free Games Type Error:', error);
      return null;
    }
  }
};

// Fallback mock data generator
const MockDataGenerator = {
  generateAnalysis: function (url, gameName) {
    const currentPrice = (Math.random() * 50 + 10).toFixed(2);
    const historicalLow = (currentPrice * (0.2 + Math.random() * 0.3)).toFixed(2);
    const score = Math.floor(Math.random() * 40) + 60;

    let recommendation;
    if (score >= 80) recommendation = 'BUY';
    else if (score >= 60) recommendation = 'WAIT';
    else recommendation = 'PASS';

    // Generate price history for last 12 months
    const priceHistory = this.generatePriceHistory(parseFloat(currentPrice));

    // Calculate best time to buy
    const bestTimeAnalysis = this.analyzeBestTimeToBuy(priceHistory);

    return {
      title: gameName || this.extractGameNameFromUrl(url),
      currentPrice: parseFloat(currentPrice),
      historicalLow: parseFloat(historicalLow),
      score: score,
      recommendation: recommendation,
      url: url,
      store: this.detectStore(url),
      priceHistory: priceHistory,
      bestTimeToBuy: bestTimeAnalysis,
      analyzedAt: new Date().toISOString()
    };
  },

  generatePriceHistory: function (currentPrice) {
    const history = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = months[date.getMonth()];

      // Simulate seasonal discounts
      let discountFactor = 1;
      const month = date.getMonth();

      // Summer sale (June-July)
      if (month === 5 || month === 6) discountFactor = 0.6;
      // Winter sale (Dec-Jan)
      else if (month === 11 || month === 0) discountFactor = 0.5;
      // Spring sale (March)
      else if (month === 2) discountFactor = 0.7;
      // Halloween/Autumn sale (Oct-Nov)
      else if (month === 9 || month === 10) discountFactor = 0.65;
      // Random smaller sales
      else if (Math.random() > 0.7) discountFactor = 0.8;

      const price = currentPrice * discountFactor * (0.9 + Math.random() * 0.2);

      history.push({
        month: monthName,
        year: date.getFullYear(),
        price: parseFloat(price.toFixed(2)),
        discount: Math.round((1 - discountFactor) * 100)
      });
    }

    return history;
  },

  analyzeBestTimeToBuy: function (priceHistory) {
    // Find the month with lowest average price
    const monthPrices = {};

    priceHistory.forEach(entry => {
      if (!monthPrices[entry.month]) {
        monthPrices[entry.month] = [];
      }
      monthPrices[entry.month].push(entry.price);
    });

    const monthAverages = Object.entries(monthPrices).map(([month, prices]) => ({
      month,
      averagePrice: prices.reduce((a, b) => a + b, 0) / prices.length
    }));

    monthAverages.sort((a, b) => a.averagePrice - b.averagePrice);

    const bestMonths = monthAverages.slice(0, 3);
    const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
    const isGoodTime = bestMonths.some(m => m.month === currentMonth);

    return {
      bestMonths: bestMonths.map(m => m.month),
      averageDiscount: Math.round((1 - bestMonths[0].averagePrice / monthAverages[monthAverages.length - 1].averagePrice) * 100),
      isGoodTime: isGoodTime,
      nextSaleMonth: bestMonths.find(m => m.month !== currentMonth)?.month || bestMonths[0].month,
      confidence: Math.floor(Math.random() * 20) + 80
    };
  },

  extractGameNameFromUrl: function (url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;

      // Try to extract game name from URL path
      let matches = path.match(/\/app\/\d+\/([^\/]+)/);
      if (matches && matches[1]) {
        return decodeURIComponent(matches[1]).replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      }
      matches = path.match(/\/(app|game|games)\/([^\/]+)/);
      if (matches && matches[2]) {
        return decodeURIComponent(matches[2])
          .replace(/[-_]/g, ' ')
          .replace(/\b\w/g, l => l.toUpperCase());
      }

      return 'Unknown Game';
    } catch {
      return 'Unknown Game';
    }
  },

  detectStore: function (url) {
    if (url.includes('steampowered.com') || url.includes('store.steam')) return 'Steam';
    if (url.includes('gog.com')) return 'GOG';
    if (url.includes('epicgames.com')) return 'Epic Games';
    if (url.includes('humblebundle.com')) return 'Humble Bundle';
    if (url.includes('greenmangaming.com')) return 'Green Man Gaming';
    if (url.includes('fanatical.com')) return 'Fanatical';
    if (url.includes('gamesplanet.com')) return 'Gamesplanet';
    return 'Unknown Store';
  },

  generateFreeGames: function () {
    const freeGames = [
      {
        id: '1',
        title: 'Apex Legends',
        description: 'Free-to-play battle royale game',
        image: 'https://via.placeholder.com/300x150/1a1a2e/4ecca3?text=Apex+Legends',
        platform: 'Steam, Origin',
        type: 'game',
        endDate: null,
        url: 'https://www.ea.com/games/apex-legends'
      },
      {
        id: '2',
        title: 'Fortnite',
        description: 'Battle royale with building mechanics',
        image: 'https://via.placeholder.com/300x150/1a1a2e/9b59b6?text=Fortnite',
        platform: 'Epic Games',
        type: 'game',
        endDate: null,
        url: 'https://www.fortnite.com'
      },
      {
        id: '3',
        title: 'Genshin Impact',
        description: 'Open-world action RPG',
        image: 'https://via.placeholder.com/300x150/1a1a2e/f39c12?text=Genshin+Impact',
        platform: 'Multiple',
        type: 'game',
        endDate: null,
        url: 'https://genshin.hoyoverse.com'
      },
      {
        id: '4',
        title: 'Warframe',
        description: 'Free-to-play cooperative action game',
        image: 'https://via.placeholder.com/300x150/1a1a2e/3498db?text=Warframe',
        platform: 'Steam',
        type: 'game',
        endDate: null,
        url: 'https://www.warframe.com'
      },
      {
        id: '5',
        title: 'Destiny 2',
        description: 'Free-to-play MMO first-person shooter',
        image: 'https://via.placeholder.com/300x150/1a1a2e/e74c3c?text=Destiny+2',
        platform: 'Steam',
        type: 'game',
        endDate: null,
        url: 'https://www.bungie.net/destiny2'
      },
      {
        id: '6',
        title: 'League of Legends',
        description: 'Popular MOBA game',
        image: 'https://via.placeholder.com/300x150/1a1a2e/f1c40f?text=League+of+Legends',
        platform: 'Riot Client',
        type: 'game',
        endDate: null,
        url: 'https://www.leagueoflegends.com'
      }
    ];

    // Add limited time offers
    const limitedOffers = [
      {
        id: '7',
        title: 'Free DLC Pack - Limited Time',
        description: 'Exclusive DLC available for free this week only!',
        image: 'https://via.placeholder.com/300x150/1a1a2e/e67e22?text=Free+DLC',
        platform: 'Steam',
        type: 'dlc',
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        url: '#'
      }
    ];

    return [...freeGames, ...limitedOffers];
  }
};

const App = {
  // Application state
  state: {
    user: null,
    subscription: { plan: 'free' },
    monthlyUsage: { count: 0, remaining: 5 },
    isLoading: false,
    currentAnalysis: null,
    favorites: [],
    history: []
  },

  // Initialize application
  init: async function () {
    console.log('GamePrice AI initializing...');

    // Wait for Firebase to be ready
    await this.waitForFirebase();

    // Initialize auth
    if (window.Auth) {
      window.Auth.init();

      // Listen for auth state changes
      window.Auth.onAuthStateChanged(async (user) => {
        this.state.user = user;
        if (user) {
          // Check for Stripe checkout success AFTER auth is confirmed, so user is not null
          if (window.StripeIntegration) {
            await window.StripeIntegration.handleCheckoutSuccess();
            window.StripeIntegration.handleCheckoutCancel();
          }

          await this.loadUserData();
          await this.loadFavorites();
          await this.loadHistory();
        }
        this.updateUI();
      });
    }

    // Initialize page-specific functionality
    this.initPageSpecific();

    console.log('GamePrice AI initialized');
  },

  // Wait for Firebase to be ready
  waitForFirebase: function () {
    return new Promise((resolve) => {
      const check = () => {
        if (window.firebaseAuth && window.firebaseDb) {
          resolve();
        } else {
          setTimeout(check, 100);
        }
      };
      check();
    });
  },

  // Load user data from Firestore
  loadUserData: async function () {
    if (!this.state.user) return;

    try {
      // Get subscription status
      if (window.subscriptionManager) {
        this.state.subscription = await window.subscriptionManager.getSubscription(this.state.user.uid);
      }

      // Get monthly usage
      if (window.usageTracker) {
        const usage = await window.usageTracker.getMonthlyUsage(this.state.user.uid);
        const remaining = await window.usageTracker.getRemaining(this.state.user.uid);
        this.state.monthlyUsage = {
          count: usage.count,
          remaining: remaining
        };
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  },

  // Load favorites
  loadFavorites: async function () {
    if (!this.state.user || !window.favoritesManager) return;

    try {
      this.state.favorites = await window.favoritesManager.getAll(this.state.user.uid);
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
  },

  // Load history
  loadHistory: async function () {
    if (!this.state.user || !window.historyManager) return;

    try {
      this.state.history = await window.historyManager.getAll(this.state.user.uid, 20);
    } catch (error) {
      console.error('Error loading history:', error);
    }
  },

  // Update UI based on state
  updateUI: function () {
    // Update usage display
    const usageElements = document.querySelectorAll('.usage-display');
    usageElements.forEach(el => {
      const plan = this.state.subscription.plan;
      const planConfig = window.PLANS?.[plan];

      if (plan === 'diamond') {
        el.innerHTML = '<span class="usage-badge diamond">Diamond - Unlimited</span>';
      } else if (plan === 'gold') {
        el.innerHTML = `<span class="usage-badge gold">Gold - ${this.state.monthlyUsage.remaining} remaining</span>`;
      } else if (plan === 'silver') {
        el.innerHTML = `<span class="usage-badge silver">Silver - ${this.state.monthlyUsage.remaining} remaining</span>`;
      } else if (plan === 'bronze') {
        el.innerHTML = `<span class="usage-badge bronze">Bronze - ${this.state.monthlyUsage.remaining} remaining</span>`;
      } else {
        el.innerHTML = `<span class="usage-badge">Free - ${this.state.monthlyUsage.remaining} remaining</span>`;
      }
    });

    // Update plan badges
    const planBadges = document.querySelectorAll('.plan-badge');
    planBadges.forEach(el => {
      const plan = this.state.subscription.plan;
      el.className = `plan-badge ${plan}`;
      el.textContent = plan.charAt(0).toUpperCase() + plan.slice(1);
    });

    // Update account profile info if user is authenticated
    if (this.state.user) {
      document.querySelectorAll('.account-email').forEach(el => {
        el.textContent = this.state.user.email;
      });
      const accountIdEl = document.getElementById('account-id');
      if (accountIdEl) {
        accountIdEl.textContent = this.state.user.uid.substring(0, 12) + '...';
      }
    }

    // Re-render UI content based on page
    const path = window.location.pathname;
    if (path.includes('dashboard')) {
      this.displayRecentHistory();
    } else if (path.includes('favorites')) {
      this.displayFavorites();
    } else if (path.includes('history')) {
      this.displayFullHistory();
    }
  },

  // Initialize page-specific functionality
  initPageSpecific: function () {
    const path = window.location.pathname;

    if (path.includes('dashboard')) {
      this.initDashboard();
    } else if (path.includes('account')) {
      this.initAccount();
    } else if (path.includes('favorites')) {
      this.initFavorites();
    } else if (path.includes('free-games')) {
      this.initFreeGames();
    } else if (path.includes('history')) {
      this.initHistory();
    } else if (path === '/' || path.includes('index')) {
      this.initLanding();
    }
  },

  // Initialize landing page
  initLanding: function () {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    });
  },

  // Initialize dashboard page
  initDashboard: function () {
    if (window.Auth) {
      window.Auth.requireAuth('/index.html');
    }

    const analyzeForm = document.getElementById('analyze-form');
    if (analyzeForm) {
      analyzeForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAnalysis();
      });
    }

    const upgradeBtn = document.getElementById('upgrade-btn');
    if (upgradeBtn) {
      upgradeBtn.addEventListener('click', () => {
        this.handleUpgrade();
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }

    // Load recent history
    this.displayRecentHistory();
  },

  // Initialize account page
  initAccount: function () {
    if (window.Auth) {
      window.Auth.requireAuth('/index.html');
    }

    this.loadAccountInfo();

    const manageSubBtn = document.getElementById('manage-subscription-btn');
    if (manageSubBtn) {
      manageSubBtn.addEventListener('click', () => {
        this.handleManageSubscription();
      });
    }

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        this.handleLogout();
      });
    }
  },

  // Initialize favorites page
  initFavorites: function () {
    if (window.Auth) {
      window.Auth.requireAuth('/index.html');
    }

    this.displayFavorites();
  },

  // Initialize free games page
  initFreeGames: function () {
    this.displayFreeGames();
  },

  // Initialize history page
  initHistory: function () {
    if (window.Auth) {
      window.Auth.requireAuth('/index.html');
    }

    this.displayFullHistory();

    const clearBtn = document.getElementById('clear-history-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        const user = window.Auth?.getCurrentUser() || this.state.user;
        if (!user) {
          this.showError('User not properly authenticated. Please refresh.');
          return;
        }

        this.showConfirmDialog(
          'Clear History',
          'Are you sure you want to clear your analysis history? This cannot be undone.',
          async () => {
            if (window.historyManager) {
              const result = await window.historyManager.clear(user.uid);
              if (result) {
                this.state.history = [];
                this.displayFullHistory();
                this.showSuccess('History cleared successfully');
              } else {
                this.showError('Failed to clear history');
              }
            }
          }
        );
      });
    }
  },

  // Handle game analysis
  handleAnalysis: async function () {
    const urlInput = document.getElementById('game-url');
    const resultsContainer = document.getElementById('results-container');
    const analyzeBtn = document.getElementById('analyze-btn');

    if (!urlInput || !analyzeBtn) return;

    const url = urlInput.value.trim();

    if (!url) {
      this.showError('Please enter a game URL or game name');
      return;
    }

    const canAnalyze = await window.usageTracker.canAnalyze(this.state.user.uid);
    if (!canAnalyze) {
      this.showError('Monthly limit reached. Upgrade your plan for more analyses.');
      return;
    }

    this.setLoading(true);
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="spinner"></span> Analyzing...';

    try {
      const result = await this.callGameHunterAPI(url);

      if (result.success) {
        await window.usageTracker.incrementUsage(this.state.user.uid);
        await this.loadUserData();
        this.updateUI();

        this.state.currentAnalysis = result.data;
        this.displayResults(result.data);

        // Save to history
        if (window.historyManager) {
          await window.historyManager.save(this.state.user.uid, result.data);
        }

        urlInput.value = '';
      } else {
        this.showError(result.error || 'Failed to analyze game. Please try again.');
      }
    } catch (error) {
      console.error('Analysis error:', error);
      this.showError('An error occurred. Please try again.');
    } finally {
      this.setLoading(false);
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = 'Analyze';
    }
  },

  // Call GameHunter API with fallback to mock data
  callGameHunterAPI: async function (url) {
    try {
      console.log('Analyzing game input:', url);

      let searchResults = null;
      let gameName = url;

      if (this.isValidUrl(url)) {
        gameName = MockDataGenerator.extractGameNameFromUrl(url);
      }

      // Check if it's a Steam URL to use steamAppID
      const steamMatch = url.match(/steampowered\.com\/.*?app\/(\d+)/);
      if (steamMatch && steamMatch[1]) {
        const steamId = steamMatch[1];
        searchResults = await CHEAPSHARK_API.searchGamesBySteamId(steamId);
      }

      // If not steam or no results, try by title
      if (!searchResults || searchResults.length === 0) {
        if (gameName && gameName !== 'Unknown Game') {
          searchResults = await CHEAPSHARK_API.searchGames(gameName);
        }
      }

      if (searchResults && searchResults.length > 0) {
        const game = searchResults[0];
        const gameData = await CHEAPSHARK_API.getDeals(game.gameID);

        if (gameData && gameData.deals && gameData.deals.length > 0) {
          // get the actual current discounted price, fallback to retail if no discount
          const currentPrice = parseFloat(gameData.deals[0].price) || parseFloat(gameData.deals[0].retailPrice) || 29.99;
          const cheapestPrice = parseFloat(gameData.cheapestPriceEver?.price) || parseFloat(gameData.deals[0].price) || currentPrice * 0.4;

          // Calculate score based on current vs historical low
          const ratio = currentPrice / (cheapestPrice * 2.5);
          const score = Math.max(0, Math.min(100, Math.round((1 - ratio) * 100 + 50)));

          let recommendation;
          if (score >= 80) recommendation = 'BUY';
          else if (score >= 50) recommendation = 'WAIT';
          else recommendation = 'PASS';

          const priceHistory = MockDataGenerator.generatePriceHistory(currentPrice);
          const bestTimeAnalysis = MockDataGenerator.analyzeBestTimeToBuy(priceHistory);

          let storeName = MockDataGenerator.detectStore(url);
          try {
            const stores = await CHEAPSHARK_API.getStores();
            if (stores && gameData.deals[0]) {
              const storeInfo = stores.find(s => s.storeID === gameData.deals[0].storeID);
              if (storeInfo) {
                storeName = storeInfo.storeName;
              }
            }
          } catch (e) { }

          let aiRecommendationText = '';
          try {
            const aiResponse = await fetch('/api/analyze-game', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                gameName: game.external || gameName,
                currentPrice: currentPrice,
                historicalLow: cheapestPrice,
                score: score,
                url: url,
                plan: App.state.subscription.plan || 'free'
              })
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              if (aiData.success) {
                recommendation = aiData.aiRecommendation || recommendation;
                aiRecommendationText = aiData.aiReasoning;
              }
            }
          } catch (e) {
            console.error('Failed to get Gemini analysis:', e);
          }

          return {
            success: true,
            data: {
              title: game.external || gameName,
              currentPrice: currentPrice,
              historicalLow: cheapestPrice,
              score: score,
              recommendation: recommendation,
              url: url,
              store: storeName === 'Unknown Store' && !this.isValidUrl(url) ? 'Multiple Stores' : storeName,
              appId: game.gameID,
              imageUrl: game.thumb || gameData.info?.thumb,
              priceHistory: priceHistory,
              bestTimeToBuy: bestTimeAnalysis,
              aiReasoning: aiRecommendationText,
              analyzedAt: new Date().toISOString()
            }
          };
        }
      }

      // If we reach here, we didn't find the game
      return {
        success: false,
        error: 'Não foi possível encontrar o jogo ou seus preços. Verifique a URL e tente novamente.'
      };
    } catch (error) {
      console.error('API call error:', error);

      // Return error on exception
      return {
        success: false,
        error: 'Ocorreu um erro ao buscar os preços. Tente novamente mais tarde.'
      };
    }
  },

  // Display analysis results
  displayResults: async function (data) {
    const resultsContainer = document.getElementById('results-container');
    if (!resultsContainer) return;

    const recommendationClass = data.recommendation.toLowerCase();
    const recommendationText = {
      'BUY': 'Great Deal - Buy Now!',
      'WAIT': 'Wait for Better Price',
      'PASS': 'Not Recommended'
    };

    const canFavorite = await window.subscriptionManager.canFavorite(this.state.user.uid);
    const isFavorited = this.state.favorites.some(f => f.gameId === (data.appId || data.title));
    const canSeeBestTime = await window.subscriptionManager.canSeeBestTime(this.state.user.uid);

    let bestTimeHtml = '';
    if (canSeeBestTime && data.bestTimeToBuy) {
      bestTimeHtml = `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 1rem; color: var(--accent-primary);">📅 Best Time to Buy Analysis</h4>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <div class="result-item" style="text-align: left;">
              <div class="result-label">Best Months to Buy</div>
              <div class="result-value" style="font-size: 1.25rem;">${data.bestTimeToBuy.bestMonths.join(', ')}</div>
            </div>
            <div class="result-item" style="text-align: left;">
              <div class="result-label">Average Discount</div>
              <div class="result-value" style="font-size: 1.25rem; color: var(--accent-success);">${data.bestTimeToBuy.averageDiscount}%</div>
            </div>
            <div class="result-item" style="text-align: left;">
              <div class="result-label">Next Expected Sale</div>
              <div class="result-value" style="font-size: 1.25rem;">${data.bestTimeToBuy.nextSaleMonth}</div>
            </div>
          </div>
          <div style="margin-top: 1rem; padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <p style="margin: 0; color: var(--text-secondary);">
              ${data.bestTimeToBuy.isGoodTime
          ? '✅ <strong>Good timing!</strong> This is typically a good month to buy.'
          : `⏳ <strong>Consider waiting.</strong> Better deals usually appear in ${data.bestTimeToBuy.bestMonths[0]}.`}
              <br><small>Analysis confidence: ${data.bestTimeToBuy.confidence}%</small>
            </p>
          </div>
        </div>
      `;
    } else if (!canSeeBestTime) {
      bestTimeHtml = `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <div style="padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md); text-align: center;">
            <p style="margin: 0; color: var(--text-secondary);">
              🔒 <strong>Upgrade to Silver, Gold or Diamond</strong> to see the best time to buy analysis.
            </p>
            <a href="account.html" class="btn btn-purple btn-sm mt-2" style="font-size: 0.875rem;">Upgrade Now</a>
          </div>
        </div>
      `;
    }

    // Price history chart
    let priceHistoryHtml = '';
    if (data.priceHistory) {
      priceHistoryHtml = `
        <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color);">
          <h4 style="margin-bottom: 1rem;">📈 12-Month Price History</h4>
          <div style="width: 100%; height: 350px; padding: 10px; background: var(--bg-tertiary); border-radius: var(--radius-md); position: relative;">
            <canvas id="priceHistoryChart"></canvas>
          </div>
        </div>
      `;
    }

    resultsContainer.innerHTML = `
      <div class="results-card fade-in">
        <div class="results-header">
          <div>
            <h3 class="game-title">${this.escapeHtml(data.title)}</h3>
            <span class="recommendation-badge ${recommendationClass}">
              ${data.recommendation}: ${recommendationText[data.recommendation]}
            </span>
          </div>
          ${canFavorite ? `
            <button id="favorite-btn" class="btn ${isFavorited ? 'btn-success' : 'btn-secondary'}" 
                    onclick="App.toggleFavorite()" style="min-width: 120px;">
              ${isFavorited ? '❤️ Favorited' : '🤍 Add to Favorites'}
            </button>
          ` : ''}
        </div>
        
        <div class="results-grid">
          <div class="result-item">
            <div class="result-label">Current Price</div>
            <div class="result-value price">$${data.currentPrice.toFixed(2)}</div>
          </div>
          <div class="result-item">
            <div class="result-label">Historical Low</div>
            <div class="result-value">$${data.historicalLow.toFixed(2)}</div>
          </div>
          <div class="result-item">
            <div class="result-label">Deal Score</div>
            <div class="result-value score">${data.score}/100</div>
          </div>
          <div class="result-item">
            <div class="result-label">Potential Savings</div>
            <div class="result-value">$${(data.currentPrice - data.historicalLow).toFixed(2)}</div>
          </div>
        </div>
        
        ${data.aiReasoning ? `
          <div style="margin-top: 1.5rem; padding: 1.5rem; background: var(--bg-tertiary); border-radius: var(--radius-md); border-left: 4px solid var(--accent-primary);">
            <h4 style="margin-bottom: 0.5rem; color: var(--accent-primary);">✨ Gemini AI Analysis</h4>
            <p style="margin: 0; color: var(--text-secondary); line-height: 1.5;">${data.aiReasoning}</p>
          </div>
        ` : ''}

        ${priceHistoryHtml}
        ${bestTimeHtml}
      </div>
    `;

    resultsContainer.classList.remove('hidden');

    if (data.priceHistory && typeof Chart !== 'undefined') {
      const ctx = document.getElementById('priceHistoryChart');
      if (ctx) {
        if (window.priceChartInstance) {
          window.priceChartInstance.destroy();
        }

        const labels = data.priceHistory.map(h => h.month + (h.year ? ' ' + String(h.year).slice(-2) : ''));
        const prices = data.priceHistory.map(h => h.price);
        const discounts = data.priceHistory.map(h => h.discount);

        window.priceChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: labels,
            datasets: [
              {
                type: 'line',
                label: 'Discount (%)',
                data: discounts,
                borderColor: '#10b981', // green for discount
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderWidth: 2,
                tension: 0.3,
                yAxisID: 'y1',
                pointBackgroundColor: '#10b981'
              },
              {
                type: 'bar',
                label: 'Price ($)',
                data: prices,
                backgroundColor: '#8b5cf6', // purple 
                borderRadius: 4,
                yAxisID: 'y'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                labels: {
                  color: '#9ca3af'
                }
              },
              tooltip: {
                backgroundColor: 'rgba(17, 24, 39, 0.9)',
                titleColor: '#f9fafb',
                bodyColor: '#e5e7eb',
                borderColor: '#374151',
                borderWidth: 1
              }
            },
            scales: {
              y: {
                type: 'linear',
                display: true,
                position: 'left',
                grid: {
                  color: '#374151'
                },
                ticks: {
                  color: '#9ca3af',
                  callback: function (value) {
                    return '$' + value;
                  }
                },
                title: {
                  display: true,
                  text: 'Price ($)',
                  color: '#9ca3af'
                }
              },
              y1: {
                type: 'linear',
                display: true,
                position: 'right',
                grid: {
                  drawOnChartArea: false,
                },
                ticks: {
                  color: '#10b981',
                  callback: function (value) {
                    return value + '%';
                  }
                },
                title: {
                  display: true,
                  text: 'Discount (%)',
                  color: '#10b981'
                }
              },
              x: {
                grid: {
                  display: false
                },
                ticks: {
                  color: '#9ca3af'
                }
              }
            }
          }
        });
      }
    }
  },

  // Toggle favorite
  toggleFavorite: async function () {
    if (!this.state.user || !this.state.currentAnalysis) return;

    const canFavorite = await window.subscriptionManager.canFavorite(this.state.user.uid);
    if (!canFavorite) {
      this.showError('🔒 Favorites feature is locked. Please upgrade your plan.');
      return;
    }

    const gameId = this.state.currentAnalysis.appId || this.state.currentAnalysis.title;
    const isFavorited = this.state.favorites.some(f => f.gameId === gameId);

    try {
      if (isFavorited) {
        await window.favoritesManager.remove(this.state.user.uid, gameId);
        this.showSuccess('Removed from favorites');
      } else {
        await window.favoritesManager.add(this.state.user.uid, this.state.currentAnalysis);
        this.showSuccess('Added to favorites');
      }

      await this.loadFavorites();
      this.displayResults(this.state.currentAnalysis);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      this.showError('Failed to update favorites');
    }
  },

  // Display favorites
  displayFavorites: async function () {
    const container = document.getElementById('favorites-container');
    if (!container) return;

    const canFavorite = await window.subscriptionManager.canFavorite(this.state.user.uid);

    if (!canFavorite) {
      container.innerHTML = `
        <div class="alert alert-info" style="text-align: center;">
          <p>🔒 <strong>Favorites feature is locked.</strong></p>
          <p>Upgrade to a Bronze, Silver, Gold, or Diamond plan to save your favorite games.</p>
          <a href="account.html" class="btn btn-primary mt-3">Upgrade Now</a>
        </div>
      `;
      return;
    }

    if (this.state.favorites.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="padding: 3rem;">
          <p style="color: var(--text-secondary); font-size: 1.25rem;">No favorites yet</p>
          <p style="color: var(--text-muted);">Analyze games and add them to your favorites!</p>
          <a href="dashboard.html" class="btn btn-primary mt-3">Go to Dashboard</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="features-grid" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
        ${this.state.favorites.map(game => `
          <div class="feature-card" style="position: relative;">
            <button onclick="App.removeFavorite(decodeURIComponent('${encodeURIComponent(game.appId || game.title)}'))" 
                    style="position: absolute; top: 10px; right: 10px; background: var(--accent-danger); border: none; 
                           color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: 1rem;">
              ×
            </button>
            <h4 class="feature-title">${this.escapeHtml(game.title)}</h4>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">
              Current: <span style="color: var(--accent-success); font-weight: 600;">$${game.currentPrice?.toFixed(2) || 'N/A'}</span>
            </p>
            <p style="color: var(--text-muted); font-size: 0.875rem; margin: 0;">
              Lowest: $${game.historicalLow?.toFixed(2) || 'N/A'}
            </p>
            <p style="color: var(--text-muted); font-size: 0.75rem; margin-top: 0.5rem;">
              ${game.store || 'Unknown Store'}
            </p>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Remove favorite
  removeFavorite: async function (gameId) {
    if (!this.state.user) return;

    try {
      await window.favoritesManager.remove(this.state.user.uid, gameId);
      await this.loadFavorites();
      this.displayFavorites();
      this.showSuccess('Removed from favorites');
    } catch (error) {
      console.error('Error removing favorite:', error);
      this.showError('Failed to remove favorite');
    }
  },

  // Display free games
  displayFreeGames: async function () {
    const container = document.getElementById('free-games-container');
    if (!container) return;

    container.innerHTML = '<div class="text-center" style="padding: 2rem;"><span class="spinner"></span> Loading free games...</div>';

    try {
      // Try to fetch real free games
      let freeGames = await FREEGAMES_API.getFreeGames();

      // Fallback to mock data
      if (!freeGames || freeGames.length === 0) {
        freeGames = MockDataGenerator.generateFreeGames();
      }

      this.state.freeGames = freeGames;
      this.filterFreeGames('all');
    } catch (error) {
      console.error('Error loading free games:', error);
      container.innerHTML = `
        <div class="alert alert-error">
          Failed to load free games. Please try again later.
        </div>
      `;
    }
  },

  filterFreeGames: function (filterType) {
    const container = document.getElementById('free-games-container');
    if (!container) return;

    let filteredGames = this.state.freeGames || [];

    if (filterType && filterType !== 'all') {
      if (filterType === 'limited') {
        filteredGames = filteredGames.filter(g => g.endDate);
      } else {
        filteredGames = filteredGames.filter(g => {
          const platform = (g.platform || '').toLowerCase();
          return platform.includes(filterType) || (filterType === 'pc' && platform.includes('windows'));
        });
      }
    }

    const permanentFree = filteredGames.filter(g => !g.endDate);
    const limitedTime = filteredGames.filter(g => g.endDate);

    container.innerHTML = `
      ${limitedTime.length > 0 ? `
        <div style="margin-bottom: 3rem;">
          <h3 style="margin-bottom: 1.5rem; color: var(--accent-warning);">⏰ Limited Time Offers</h3>
          <div class="features-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
            ${limitedTime.map(game => `
              <div class="feature-card" style="border-color: var(--accent-warning);">
                <div style="background: var(--accent-warning); color: var(--bg-primary); padding: 0.25rem 0.5rem; 
                            border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600; 
                            display: inline-block; margin-bottom: 1rem;">
                  FREE UNTIL: ${new Date(game.endDate).toLocaleDateString()}
                </div>
                ${game.image ? `<img src="${game.image}" alt="${this.escapeHtml(game.title)}" style="width: 100%; border-radius: var(--radius-sm); margin-bottom: 1rem; height: 150px; object-fit: cover;">` : ''}
                <h4 class="feature-title">${this.escapeHtml(game.title)}</h4>
                <p class="feature-description">${this.escapeHtml(game.description)}</p>
                <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
                  Platform: ${game.platform}
                </p>
                <a href="${game.url}" target="_blank" class="btn btn-primary btn-full mt-3">
                  Get it Free →
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      <div>
        <h3 style="margin-bottom: 1.5rem; color: var(--accent-success);">🎮 Always Free to Play</h3>
        ${permanentFree.length > 0 ? `
        <div class="features-grid" style="grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
          ${permanentFree.map(game => `
            <div class="feature-card">
              <div style="background: var(--accent-success); color: var(--bg-primary); padding: 0.25rem 0.5rem; 
                          border-radius: var(--radius-sm); font-size: 0.75rem; font-weight: 600; 
                          display: inline-block; margin-bottom: 1rem;">
                FREE TO PLAY
              </div>
              ${game.image ? `<img src="${game.image}" alt="${this.escapeHtml(game.title)}" style="width: 100%; border-radius: var(--radius-sm); margin-bottom: 1rem; height: 150px; object-fit: cover;">` : ''}
              <h4 class="feature-title">${this.escapeHtml(game.title)}</h4>
              <p class="feature-description">${this.escapeHtml(game.description)}</p>
              <p style="color: var(--text-muted); font-size: 0.875rem; margin-top: 0.5rem;">
                Platform: ${game.platform}
              </p>
              <a href="${game.url}" target="_blank" class="btn btn-success btn-full mt-3">
                Play Free →
              </a>
            </div>
          `).join('')}
        </div>
        ` : '<p style="color: var(--text-muted);">No free games match your criteria.</p>'}
      </div>
    `;
  },

  // Display recent history
  displayRecentHistory: async function () {
    const container = document.getElementById('recent-history-container');
    if (!container) return;

    if (this.state.history.length === 0) {
      container.innerHTML = '<p style="color: var(--text-muted); text-align: center;">No recent analyses</p>';
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${this.state.history.slice(0, 5).map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; 
                      padding: 0.75rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div>
              <p style="margin: 0; font-weight: 500;">${this.escapeHtml(item.title)}</p>
              <p style="margin: 0; font-size: 0.75rem; color: var(--text-muted);">
                ${new Date(item.analyzedAt?.toDate?.() || item.analyzedAt).toLocaleDateString()}
              </p>
            </div>
            <div style="text-align: right;">
              <span class="recommendation-badge ${item.recommendation?.toLowerCase()}" 
                    style="font-size: 0.75rem; padding: 0.25rem 0.5rem;">
                ${item.recommendation}
              </span>
              <p style="margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--accent-success);">
                $${item.currentPrice?.toFixed(2)}
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Display full history
  displayFullHistory: async function () {
    const container = document.getElementById('history-container');
    if (!container) return;

    if (this.state.history.length === 0) {
      container.innerHTML = `
        <div class="text-center" style="padding: 3rem;">
          <p style="color: var(--text-secondary); font-size: 1.25rem;">No history yet</p>
          <p style="color: var(--text-muted);">Start analyzing games to build your history!</p>
          <a href="dashboard.html" class="btn btn-primary mt-3">Go to Dashboard</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        ${this.state.history.map(item => `
          <div style="display: flex; justify-content: space-between; align-items: center; 
                      padding: 1rem; background: var(--bg-tertiary); border-radius: var(--radius-md);">
            <div>
              <p style="margin: 0; font-weight: 600;">${this.escapeHtml(item.title)}</p>
              <p style="margin: 0.25rem 0 0; font-size: 0.875rem; color: var(--text-muted);">
                ${new Date(item.analyzedAt?.toDate?.() || item.analyzedAt).toLocaleString()}
              </p>
            </div>
            <div style="text-align: right;">
              <span class="recommendation-badge ${item.recommendation?.toLowerCase()}" 
                    style="font-size: 0.875rem; padding: 0.375rem 0.75rem;">
                ${item.recommendation}
              </span>
              <p style="margin: 0.5rem 0 0;">
                <span style="color: var(--text-muted);">Current:</span> 
                <span style="color: var(--accent-success); font-weight: 600;">$${item.currentPrice?.toFixed(2)}</span>
              </p>
              <p style="margin: 0; font-size: 0.875rem;">
                <span style="color: var(--text-muted);">Lowest:</span> 
                <span style="color: var(--accent-primary);">$${item.historicalLow?.toFixed(2)}</span>
              </p>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  // Load account info
  loadAccountInfo: async function () {
    const user = this.state.user;
    if (!user) return;

    await this.loadUserData();
    this.updateUI();
  },

  // Handle upgrade
  handleUpgrade: function () {
    window.location.href = 'account.html#pricing';
  },

  // Handle manage subscription
  handleManageSubscription: async function () {
    if (!window.StripeIntegration) {
      this.showError('Payment system not available');
      return;
    }

    const result = await window.StripeIntegration.openCustomerPortal();

    if (!result.success && !result.mock) {
      this.showError(result.error || 'Failed to open customer portal');
    }
  },

  // Handle logout
  handleLogout: async function () {
    if (!window.Auth) return;

    const result = await window.Auth.signOut();

    if (result.success) {
      window.location.href = '/index.html';
    } else {
      this.showError(result.error || 'Failed to sign out');
    }
  },

  // Set loading state
  setLoading: function (loading) {
    this.state.isLoading = loading;
    document.body.classList.toggle('is-loading', loading);
  },

  // Show error message
  showError: function (message) {
    this.showNotification(message, 'error');
  },

  // Show success message
  showSuccess: function (message) {
    this.showNotification(message, 'success');
  },

  // Show notification
  showNotification: function (message, type = 'info') {
    const existing = document.querySelectorAll('.app-notification');
    existing.forEach(el => el.remove());

    const notification = document.createElement('div');
    notification.className = `alert alert-${type} app-notification`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 100px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 9999;
      min-width: 300px;
      text-align: center;
      animation: fadeIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'fadeOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // Custom confirmation dialog to bypass native blockers
  showConfirmDialog: function (title, message, onConfirm) {
    const existing = document.getElementById('app-confirm-dialog');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'app-confirm-dialog';
    overlay.style.cssText = `
      position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex;
      align-items: center; justify-content: center; z-index: 10000;
      animation: fadeIn 0.2s ease;
    `;

    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: var(--bg-secondary); padding: 2rem; border-radius: var(--radius-lg);
      max-width: 400px; width: 90%; border: 1px solid var(--border-color);
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
    `;
    dialog.innerHTML = `
      <h3 style="margin-top: 0; font-size: 1.25rem; font-weight: 600;">${this.escapeHtml(title)}</h3>
      <p style="color: var(--text-muted); margin-bottom: 1.5rem; line-height: 1.5;">${this.escapeHtml(message)}</p>
      <div style="display: flex; justify-content: flex-end; gap: 1rem;">
        <button id="dialog-cancel-btn" class="btn btn-secondary">Cancel</button>
        <button id="dialog-confirm-btn" class="btn btn-primary" style="background: var(--accent-danger); border-color: var(--accent-danger);">Confirm</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const close = () => {
      overlay.style.animation = 'fadeOut 0.2s ease forwards';
      setTimeout(() => overlay.remove(), 200);
    };

    document.getElementById('dialog-cancel-btn').addEventListener('click', close);
    document.getElementById('dialog-confirm-btn').addEventListener('click', () => {
      close();
      onConfirm();
    });
  },

  // Validate URL
  isValidUrl: function (string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  },

  // Escape HTML to prevent XSS
  escapeHtml: function (text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
};

// Auth page handlers
const AuthPages = {
  initLogin: function () {
    if (window.Auth) {
      window.Auth.redirectIfAuthenticated('/dashboard.html');
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleLogin();
      });
    }

    const googleBtn = document.getElementById('google-signin-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await this.handleGoogleSignIn();
      });
    }
  },

  initSignup: function () {
    if (window.Auth) {
      window.Auth.redirectIfAuthenticated('/dashboard.html');
    }

    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        await this.handleSignup();
      });
    }

    const googleBtn = document.getElementById('google-signup-btn');
    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        await this.handleGoogleSignIn();
      });
    }
  },

  handleLogin: async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const submitBtn = document.querySelector('#login-form button[type="submit"]');

    if (!email || !password) {
      this.showAuthError('Please enter both email and password');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Signing in...';

    const result = await window.Auth.signIn(email, password);

    if (result.success) {
      window.location.href = '/dashboard.html';
    } else {
      this.showAuthError(result.error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Sign In';
    }
  },

  handleSignup: async function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    const submitBtn = document.querySelector('#signup-form button[type="submit"]');

    if (!email || !password) {
      this.showAuthError('Please enter both email and password');
      return;
    }

    if (password !== confirmPassword) {
      this.showAuthError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      this.showAuthError('Password must be at least 6 characters');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Creating account...';

    const result = await window.Auth.signUp(email, password);

    if (result.success) {
      window.location.href = '/dashboard.html';
    } else {
      this.showAuthError(result.error);
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Create Account';
    }
  },

  handleGoogleSignIn: async function () {
    const result = await window.Auth.signInWithGoogle();

    if (result.success) {
      window.location.href = '/dashboard.html';
    } else {
      this.showAuthError(result.error);
    }
  },

  showAuthError: function (message) {
    const errorElement = document.getElementById('auth-error');
    if (errorElement) {
      errorElement.textContent = message;
      errorElement.classList.remove('hidden');
    } else {
      alert(message);
    }
  }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  App.init();

  const path = window.location.pathname;
  if (path.includes('login')) {
    AuthPages.initLogin();
  } else if (path.includes('signup')) {
    AuthPages.initSignup();
  }
});

// Export for global access
window.App = App;
window.AuthPages = AuthPages;
window.ITAD_API = ITAD_API;
window.CHEAPSHARK_API = CHEAPSHARK_API;
window.FREEGAMES_API = FREEGAMES_API;
window.MockDataGenerator = MockDataGenerator;
