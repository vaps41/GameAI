/**
 * GamePrice AI - Stripe Integration Module
 * Stripe Checkout and Customer Portal functionality
 */

// Stripe configuration - Loaded dynamically from the backend .env
const STRIPE_CONFIG = {
  publishableKey: window.ENV_CONFIG?.STRIPE_PUBLISHABLE_KEY || 'pk_test_51Oa95nGV0Sxov0osSOAojBXG8twhkGR3uMOMjeBqLylrhreSjxC3gkfCP0zo28VqQtks0iqWxKpgqPzVHHVNMC4l00ANjEsIZC', // Fallback as a backup
  // Price IDs for each plan
  priceIds: {
    bronze: 'price_1T4a60GV0Sxov0oskmi3quiZ',       // $6.25/month
    silver: 'price_1T4a5xGV0Sxov0osI1jAZtLD',        // $10.23/month
    gold: 'price_1T4a5rGV0Sxov0osBdwJ8Tx6',         // $35.27/month
    diamond: 'price_1T4a5yGV0Sxov0os3PbVOGrH'     // $52.15/month
  },
  successUrl: window.location.origin + '/dashboard.html?checkout=success',
  cancelUrl: window.location.origin + '/account.html?checkout=cancelled'
};

// Plan display names and prices
const PLAN_DETAILS = {
  bronze: {
    name: 'Bronze',
    price: 6.25,
    description: '50 analyses per month + Favorites'
  },
  silver: {
    name: 'Silver',
    price: 10.23,
    description: '200 analyses per month + Favorites + Best Time Analysis'
  },
  gold: {
    name: 'Gold',
    price: 35.27,
    description: '500 analyses per month + All Features'
  },
  diamond: {
    name: 'Diamond',
    price: 52.15,
    description: 'Unlimited analyses + All Features'
  }
};

// Initialize Stripe
let stripe = null;

try {
  if (window.Stripe) {
    stripe = Stripe(STRIPE_CONFIG.publishableKey);
    console.log('Stripe initialized successfully');
  }
} catch (error) {
  console.error('Stripe initialization error:', error);
}

const StripeIntegration = {
  // Stripe instance
  stripe: stripe,

  // Initialize Stripe
  init: function () {
    if (!window.Stripe) {
      console.error('Stripe.js not loaded');
      return false;
    }

    if (!this.stripe) {
      this.stripe = Stripe(STRIPE_CONFIG.publishableKey);
    }

    return true;
  },

  // Create checkout session for subscription
  createCheckoutSession: async function (planType) {
    if (!this.init()) {
      return { success: false, error: 'Stripe not initialized' };
    }

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) {
      return { success: false, error: 'Please sign in to subscribe' };
    }

    const priceId = STRIPE_CONFIG.priceIds[planType];
    if (!priceId) {
      return { success: false, error: 'Invalid plan selected' };
    }

    try {
      // Get ID token for authentication
      const idToken = await user.getIdToken();

      // Call your backend/cloud function to create checkout session
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          priceId: priceId,
          planType: planType,
          successUrl: STRIPE_CONFIG.successUrl + '&plan=' + planType,
          cancelUrl: STRIPE_CONFIG.cancelUrl,
          customerEmail: user.email,
          metadata: {
            userId: user.uid,
            planType: planType
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create checkout session');
      }

      const session = await response.json();

      // Redirect directly to the Stripe Checkout URL instead of relying on stripe.js
      window.location.href = session.url;

      return { success: true };
    } catch (error) {
      console.error('Checkout error:', error);
      return { success: false, error: error.message };
    }
  },

  // Open customer portal
  openCustomerPortal: async function () {
    if (!this.init()) {
      return { success: false, error: 'Stripe not initialized' };
    }

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) {
      return { success: false, error: 'Please sign in to manage subscription' };
    }

    try {
      // Get user data to check for stripeCustomerId
      const userData = await window.userDoc.get(user.uid);

      if (!userData || !userData.stripeCustomerId) {
        return { success: false, error: 'No active subscription found' };
      }

      // Get ID token for authentication
      const idToken = await user.getIdToken();

      // Call your backend/cloud function to create portal session
      const response = await fetch('/api/create-portal-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          customerId: userData.stripeCustomerId,
          returnUrl: window.location.origin + '/account.html'
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create portal session');
      }

      const session = await response.json();

      // Redirect to customer portal
      window.location.href = session.url;

      return { success: true };
    } catch (error) {
      console.error('Portal error:', error);
      return { success: false, error: error.message };
    }
  },

  // Handle checkout success
  handleCheckoutSuccess: async function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'success') {
      // Show success message
      this.showNotification('Subscription activated successfully!', 'success');

      // Update user subscription status
      const user = window.Auth ? window.Auth.getCurrentUser() : null;
      const plan = urlParams.get('plan') || 'bronze';
      if (user && window.subscriptionManager) {
        // The actual plan will be set by the webhook, but we can optimistically update
        await window.subscriptionManager.updateSubscription(user.uid, plan);
      }

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    }
    return false;
  },

  // Handle checkout cancellation
  handleCheckoutCancel: function () {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('checkout') === 'cancelled') {
      this.showNotification('Checkout was cancelled.', 'info');

      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);

      return true;
    }
    return false;
  },

  // Show notification
  showNotification: function (message, type = 'info') {
    // Check if notification container exists
    let container = document.getElementById('notification-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'notification-container';
      container.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
      `;
      document.body.appendChild(container);
    }

    // Create notification
    const notification = document.createElement('div');
    notification.className = `alert alert-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      animation: slideIn 0.3s ease;
      min-width: 300px;
    `;

    container.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease forwards';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // Get subscription status
  getSubscriptionStatus: async function () {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) {
      return { plan: 'free', isBronze: false, isSilver: false, isGold: false, isDiamond: false };
    }

    try {
      const userData = await window.userDoc.get(user.uid);
      const plan = userData?.plan || 'free';
      return {
        plan: plan,
        isFree: plan === 'free',
        isBronze: plan === 'bronze',
        isSilver: plan === 'silver',
        isGold: plan === 'gold',
        isDiamond: plan === 'diamond',
        hasPaidPlan: ['bronze', 'silver', 'gold', 'diamond'].includes(plan),
        stripeCustomerId: userData?.stripeCustomerId || null,
        stripeSubscriptionId: userData?.stripeSubscriptionId || null
      };
    } catch (error) {
      console.error('Error getting subscription status:', error);
      return { plan: 'free', isBronze: false, isSilver: false, isGold: false, isDiamond: false };
    }
  }
};

// Mock implementation for development/testing
const StripeMock = {
  // Mock checkout session
  createCheckoutSession: async function (planType) {
    console.log('Mock: Creating checkout session for', planType);

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) {
      return { success: false, error: 'Please sign in to subscribe' };
    }

    const planDetails = PLAN_DETAILS[planType];
    if (!planDetails) {
      return { success: false, error: 'Invalid plan selected' };
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Show mock checkout modal
    this.showMockCheckoutModal(planType, planDetails);

    return { success: true, mock: true };
  },

  // Show mock checkout modal
  showMockCheckoutModal: function (planType, planDetails) {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'mock-checkout-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <h3 class="modal-title">Subscribe to ${planDetails.name}</h3>
        <p class="modal-text">
          <strong>GamePrice AI ${planDetails.name} - $${planDetails.price}/month</strong><br><br>
          This is a mock checkout for development.<br>
          In production, this will redirect to Stripe Checkout.
        </p>
        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <p style="margin: 0; color: var(--text-secondary);">
            <strong>${planDetails.description}</strong>
          </p>
        </div>
        <div class="modal-buttons">
          <button class="btn btn-secondary" onclick="StripeMock.closeMockModal()">Cancel</button>
          <button class="btn btn-success" onclick="StripeMock.completeMockSubscription('${planType}')">
            Complete Subscription (Mock)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  },

  // Close mock modal
  closeMockModal: function () {
    const modal = document.getElementById('mock-checkout-modal');
    if (modal) {
      modal.remove();
    }
  },

  // Complete mock subscription
  completeMockSubscription: async function (planType) {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) return;

    // Update user to selected plan
    await window.subscriptionManager.updateSubscription(user.uid, planType, {
      customerId: 'cus_mock_' + Date.now()
    });

    this.closeMockModal();

    // Show success and redirect
    StripeIntegration.showNotification(`${PLAN_DETAILS[planType].name} subscription activated!`, 'success');

    setTimeout(() => {
      window.location.href = '/dashboard.html?checkout=success';
    }, 1500);
  },

  // Mock customer portal
  openCustomerPortal: async function () {
    console.log('Mock: Opening customer portal...');

    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) {
      return { success: false, error: 'Please sign in to manage subscription' };
    }

    const userData = await window.userDoc.get(user.uid);

    if (!userData || userData.plan === 'free') {
      return { success: false, error: 'No active subscription found' };
    }

    const planDetails = PLAN_DETAILS[userData.plan] || { name: 'Paid', price: 0 };

    // Show mock portal modal
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.id = 'mock-portal-modal';
    modal.innerHTML = `
      <div class="modal" style="max-width: 500px;">
        <h3 class="modal-title">Manage Subscription</h3>
        <p class="modal-text">
          <strong>Current Plan: ${planDetails.name} ($${planDetails.price}/month)</strong><br><br>
          This is a mock customer portal for development.<br>
          In production, this will redirect to Stripe Customer Portal.
        </p>
        <div style="background: var(--bg-tertiary); padding: 1rem; border-radius: var(--radius-md); margin-bottom: 1.5rem;">
          <p style="margin: 0; color: var(--text-secondary);">
            <strong>Subscription Details:</strong><br>
            Status: Active<br>
            Next billing: ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}<br>
            Payment method: Mock Card ending in 4242
          </p>
        </div>
        <div class="modal-buttons">
          <button class="btn btn-secondary" onclick="document.getElementById('mock-portal-modal').remove()">Close</button>
          <button class="btn btn-danger" onclick="StripeMock.cancelMockSubscription()" style="background: var(--accent-danger);">
            Cancel Subscription (Mock)
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    return { success: true, mock: true };
  },

  // Cancel mock subscription
  cancelMockSubscription: async function () {
    const user = window.Auth ? window.Auth.getCurrentUser() : null;
    if (!user) return;

    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    // Update user to free
    await window.subscriptionManager.updateSubscription(user.uid, 'free');

    document.getElementById('mock-portal-modal').remove();

    StripeIntegration.showNotification('Subscription cancelled.', 'info');

    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }
};

// Export for global access
window.StripeIntegration = StripeIntegration;
window.StripeMock = StripeMock;
window.PLAN_DETAILS = PLAN_DETAILS;

// Add CSS animations for notifications
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);
