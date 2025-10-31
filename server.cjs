// MUST BE THE FIRST LINE: Loads variables from .env file into process.env
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Use the combined models file which exports Product, Cart, Order
const { Product, Cart, Order } = require('./product.model.cjs');

const app = express();
const PORT = process.env.PORT || 3000;

// Global Constant
const DEMO_USER_ID = 'demo_user_12345';

// Get MONGO_URI from the environment variables loaded by dotenv
const MONGO_URI = process.env.MONGO_URI;

// Security Improvement: Check if the URI was loaded and exit if not
if (!MONGO_URI) {
    console.error('FATAL ERROR: MONGO_URI is not set. Please check your .env file or environment variables.');
    process.exit(1);
}

// Middleware
app.use(cors());
app.use(express.json());
// Use path.resolve for static files for better OS compatibility
app.use(express.static(path.resolve(__dirname, 'public')));

// Helper: calculate average rating
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return { avg: parseFloat((totalRating / reviews.length).toFixed(2)), count: reviews.length };
}

// --- MONGODB CONNECTION & SERVER START (FIX IMPLEMENTED HERE) ---

async function start() {
    try {
        await mongoose.connect(MONGO_URI, {
            dbName: 'test' // <-- FINAL FIX TO FORCE CONNECTION TO THE CORRECT DATABASE
        });
        console.log('MongoDB successfully connected to database: test! 🚀');

        app.listen(PORT, () => {
            console.log(`Server listening at http://localhost:${PORT}`);
        });
    } catch (err) {
        console.error('🚨 MongoDB connection error:', err.message);
        process.exit(1);
    }
}

// --- API ROUTES ---

// --- PRODUCT ROUTES ---
app.post('/api/products', async (req, res) => {
    try {
        const productData = req.body;
        
        // Price field mapping logic
        if (productData.Price) {
            productData.discountedPrice = productData.Price;
            delete productData.Price;
        } else if (productData.price) {
            productData.discountedPrice = productData.price;
            delete productData.price;
        }
        
        const newProduct = new Product(productData);
        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (err) {
        res.status(400).json({ message: 'Error adding product (Validation Failed)', error: err.message });
    }
});

app.get('/api/products', async (req, res) => {
    try {
        // Use .lean() for faster read operations if full Mongoose documents aren't needed
        const products = await Product.find({}).lean(); 
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

// ----------------------------------------------------------------------------------
// --- NEW ROUTE: UPDATE PRODUCT (PUT) ---
app.put('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const updatedData = req.body;
        
        // Remove _id and __v fields if they were accidentally passed, to prevent MongoDB errors
        delete updatedData._id;
        delete updatedData.__v;

        // Perform the update and get the modified document
        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updatedData,
            { new: true, runValidators: true } // {new: true} returns the updated document
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        res.json(updatedProduct);
    } catch (err) {
        // Validation or internal server error
        res.status(400).json({ message: 'Error updating product.', error: err.message });
    }
});

// --- NEW ROUTE: DELETE PRODUCT (DELETE) ---
app.delete('/api/products/:id', async (req, res) => {
    try {
        const productId = req.params.id;
        const result = await Product.findByIdAndDelete(productId);

        if (!result) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Send a success message or the deleted document
        res.status(200).json({ message: 'Product deleted successfully.', deletedId: productId });
    } catch (err) {
        res.status(500).json({ message: 'Error deleting product.', error: err.message });
    }
});
// ----------------------------------------------------------------------------------

app.post('/api/products/:id/review', async (req, res) => {
    try {
        const productId = req.params.id;
        // NOTE: ReviewSchema requires userId and userName, assuming 'user' contains these
        const { user, rating, comment } = req.body; 

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({ message: 'Rating must be between 1 and 5.' });
        }

        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        // Assuming 'user' object has 'userId' and 'userName' properties
        product.reviews.push({ userId: user.id || DEMO_USER_ID, userName: user.name || 'Anonymous', rating, review: comment });
        
        const { avg, count } = calculateAverageRating(product.reviews);
        product.averageRating = avg;
        product.reviewCount = count;
        await product.save();
        res.json({ message: 'Review added successfully', averageRating: avg, reviewCount: count });
    } catch (err) {
        res.status(500).json({ message: 'Error submitting review', error: err.message });
    }
});

// --- CART ROUTES ---
app.get('/api/cart', async (req, res) => {
    try {
        let cart = await Cart.findOne({ userId: DEMO_USER_ID }).populate('items.productId');
        if (!cart) cart = await Cart.create({ userId: DEMO_USER_ID, items: [] });
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching cart', error: err.message });
    }
});

app.post('/api/cart/add', async (req, res) => {
    const { productId, sku, quantity } = req.body;

    if (!productId || !sku || !quantity || quantity < 1) return res.status(400).json({ message: 'Invalid product details.' });
    try {
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found.' });

        const variant = product.variants.find(v => v.sku === sku); 
        if (!variant) return res.status(404).json({ message: 'Product variant (SKU) not found.' });
        if (variant.quantity < quantity) return res.status(400).json({ message: `Insufficient stock for ${variant.variantName}. Available: ${variant.quantity}` });

        let cart = await Cart.findOne({ userId: DEMO_USER_ID });
        if (!cart) cart = new Cart({ userId: DEMO_USER_ID, items: [] });

        const existingItemIndex = cart.items.findIndex(item => item.variantSku === sku); 

        // CRITICAL FIX: Ensure price and variant name are correct
        const itemPrice = variant.variantPrice || product.price;

        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            cart.items.push({ 
                productId, 
                variantSku: sku, 
                variantName: variant.variantName, // FIX: Save variant name
                name: product.name, // Use base name
                price: itemPrice, // FIX: Use variant price if available
                quantity 
            });
        }

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: 'Error adding to cart', error: err.message });
    }
});

app.post('/api/cart/remove', async (req, res) => {
    const { sku, quantityToRemove } = req.body;

    try {
        const cart = await Cart.findOne({ userId: DEMO_USER_ID });
        if (!cart) return res.status(404).json({ message: 'Cart not found.' });

        const itemIndex = cart.items.findIndex(item => item.variantSku === sku); 
        if (itemIndex === -1) return res.status(404).json({ message: 'Item not in cart.' });

        if (quantityToRemove >= cart.items[itemIndex].quantity) cart.items.splice(itemIndex, 1);
        else cart.items[itemIndex].quantity -= quantityToRemove;

        await cart.save();
        res.json(cart);
    } catch (err) {
        res.status(500).json({ message: 'Error removing item from cart', error: err.message });
    }
});

// --- CHECKOUT ---
app.post('/api/checkout', async (req, res) => {
    const { name, email, street, city, zip, paymentSuccess } = req.body;

    if (!name || !email || !street || !city || !zip) return res.status(400).json({ message: 'Missing contact or address information.' });

    let paymentStatus;
    let paymentNote = '';
    if (paymentSuccess === true) paymentStatus = 'Successful';
    else if (paymentSuccess === false) { paymentStatus = 'Failed'; paymentNote = 'Initial payment failure'; }
    else if (paymentSuccess === 'retry') { paymentStatus = 'Successful After Retry'; paymentNote = 'Initial failure, succeeded on retry'; }
    else return res.status(400).json({ message: 'Invalid payment status provided.' });

    try {
        const cart = await Cart.findOne({ userId: DEMO_USER_ID });
        if (!cart || cart.items.length === 0) return res.status(400).json({ message: 'Cart is empty. Cannot checkout.' });

        const session = await mongoose.startSession();
        session.startTransaction();
        try {
            let totalAmount = 0;
            const orderItems = [];
            for (const cartItem of cart.items) {
                const product = await Product.findById(cartItem.productId).session(session);
                if (!product) throw new Error(`Product not found: ${cartItem.productId}`);
                const variant = product.variants.find(v => v.sku === cartItem.variantSku); 
                if (!variant) throw new Error(`Variant not found for SKU: ${cartItem.variantSku}`); 
                if (variant.quantity < cartItem.quantity) throw new Error(`Insufficient stock for ${cartItem.name}. Only ${variant.quantity} available.`);
                
                // Deduct stock
                variant.quantity -= cartItem.quantity;
                await product.save({ session });
                
                totalAmount += cartItem.price * cartItem.quantity;
                orderItems.push(cartItem.toObject());
            }

            const newOrder = new Order({ 
                userId: DEMO_USER_ID, 
                items: orderItems, 
                totalAmount, 
                shipping: { name, email, street, city, zip }, 
                orderStatus: 'Processing', 
                paymentEvents: [{ status: paymentStatus, notes: paymentNote }] 
            });
            await newOrder.save({ session });

            // Clear cart
            cart.items = [];
            await cart.save({ session });

            await session.commitTransaction();
            session.endSession();
            res.status(201).json({ message: 'Order placed successfully!', orderId: newOrder._id, paymentStatus });
        } catch (transactionError) {
            await session.abortTransaction();
            session.endSession();
            res.status(400).json({ message: 'Checkout failed due to inventory or database error.', error: transactionError.message });
        }
    } catch (err) {
        res.status(500).json({ message: 'Internal server error during checkout.', error: err.message });
    }
});

// --- ORDERS ---
app.get('/api/orders', async (req, res) => {
    try {
        const orders = await Order.find({}).sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
});

// Fallback for frontend
app.get(/.*/, (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'Not found' });
    
    // Serve the main index file for all other paths
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
start();
