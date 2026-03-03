require('dotenv').config();
const express = require('express');
const cors = require('cors');
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_dummy';
const stripe = require('stripe')(stripeSecretKey);

const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
app.use(cors());
app.use(express.json());

// Serve dynamic config safely
app.get('/js/config.js', (req, res) => {
    res.type('application/javascript');
    res.send(`
        window.ENV_CONFIG = {
            FIREBASE_API_KEY: "${process.env.FIREBASE_API_KEY || ''}",
            STRIPE_PUBLISHABLE_KEY: "${process.env.STRIPE_PUBLISHABLE_KEY || ''}",
            ITAD_API_KEY: "${process.env.ITAD_API_KEY || ''}"
        };
    `);
});

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'dummy_key');

app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { priceId, customerEmail, successUrl, cancelUrl } = req.body;

        if (!priceId) {
            return res.status(400).json({ error: 'Missing priceId' });
        }

        // Create a Checkout Session using the fixed Stripe price ID
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            customer_email: customerEmail,
            line_items: [
                {
                    price: priceId, // Must start with 'price_'
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: successUrl || `${req.headers.origin || 'http://127.0.0.1:8000'}/dashboard.html?checkout=success`,
            cancel_url: cancelUrl || `${req.headers.origin || 'http://127.0.0.1:8000'}/account.html?checkout=cancelled`,
        });

        res.json({ id: session.id, url: session.url });
    } catch (error) {
        console.error('Error creating Stripe session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint for the customer portal (to manage subscriptions)
app.post('/api/create-portal-session', async (req, res) => {
    try {
        const { customerId } = req.body;

        if (!customerId) {
            return res.status(400).json({ error: 'Missing customerId' });
        }

        const returnUrl = req.body.returnUrl || `${req.headers.origin || 'http://127.0.0.1:8000'}/account.html`;
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customerId,
            return_url: returnUrl,
        });

        res.json({ url: portalSession.url });
    } catch (error) {
        console.error('Error creating portal session:', error);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to analyze game with Gemini based on user subscription plan
app.post('/api/analyze-game', async (req, res) => {
    try {
        const { gameName, currentPrice, historicalLow, score, url, plan } = req.body;

        // Determine which Gemini model to use based on plan
        let modelName = 'gemini-2.5-flash'; // free, bronze, silver default

        if (plan === 'gold') {
            modelName = 'gemini-2.5-pro';
        } else if (plan === 'diamond') {
            modelName = 'gemini-3-flash-preview'; // Advanced plan
        }

        const model = genAI.getGenerativeModel({ model: modelName });

        const prompt = `You are an expert in video game deals and pricing. 
        Analyze the following game deal:
        Game: ${gameName}
        Current Price: $${currentPrice}
        Historical Low: $${historicalLow}
        Calculated Deal Score: ${score}/100
        Store URL: ${url}
        
        Return a JSON response with the following format:
        {
           "recommendation": "BUY" | "WAIT" | "PASS",
           "reasoning": "A short engaging explanation of why the user should buy or wait, referencing the game."
        }
        Only return the JSON. No other text.`;

        const result = await model.generateContent(prompt);
        let aiText = result.response.text();

        // Remove markdown JSON tags if present
        aiText = aiText.replace(/```json/g, '').replace(/```/g, '').trim();

        const aiAnalysis = JSON.parse(aiText);

        res.json({
            success: true,
            modelUsed: modelName,
            aiRecommendation: aiAnalysis.recommendation,
            aiReasoning: aiAnalysis.reasoning
        });
    } catch (error) {
        console.error('Error with Gemini analysis:', error);

        // Fallback or send error
        res.status(500).json({ error: 'Failed to analyze with AI', details: error.message });
    }
});

// Endpoint to proxy GamerPower API so we bypass any CORS restrictions from browser
app.get('/api/free-games', async (req, res) => {
    try {
        const fetch = require('node-fetch');
        const response = await fetch('https://www.gamerpower.com/api/giveaways');
        if (!response.ok) {
            throw new Error(`GamerPower API failed with status: ${response.status}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('Error fetching from GamerPower:', error);
        res.status(500).json({ error: 'Failed to fetch free games' });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => console.log(`Rodando Servidor Stripe na porta ${PORT}`));
}
module.exports = app;
