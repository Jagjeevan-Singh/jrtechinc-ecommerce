// MUST BE THE FIRST LINE: Loads variables from .env file into process.env
import dotenv from "dotenv";
dotenv.config();
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import paymentRoutes from "./payment.route.js";

// Use the combined models file which exports Product, Cart, Order
import { Product, Cart, Order } from "./product.model.js";
import Payment from './payment.model.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Global Constant
const DEMO_USER_ID = 'demo_user_12345';

// Get MONGO_URI from the environment variables loaded by dotenv
const MONGO_URI = process.env.MONGO_URI;

// If MONGO_URI isn't provided we will run in a "mock/dev" mode where the
// server still starts and exposes endpoints (useful for frontend development
// and for the mock payment flow). Previously we exited the process here,
// which prevented local dev when the DB was unavailable.
if (!MONGO_URI) {
    console.warn('Warning: MONGO_URI is not set. Server will run in mock/dev mode without DB. Some features requiring DB will be disabled.');
}

// Middleware
app.use(cors());
app.use(express.json());

// Simple request logger to aid local debugging: prints method and path for every request.
app.use((req, res, next) => {
    try {
        // Log method, originalUrl and Host header to help detect proxies or dev servers
        console.log('[req]', req.method, req.originalUrl, 'Host:', req.headers && req.headers.host);
    } catch (e) {}
    next();
});

// Note: payment routes mounted lower to ensure route stack listing and
// other API routes are registered before the generic /api catch-all.
// The mount call is moved further down nearer other API routes.

// (Moved) generic JSON 404 is added after all API routes are declared so it
// doesn't preempt valid mounted routers. See bottom of file.

// Debug helpers: return and log registered routes (useful to verify payment routes are mounted)
function getRegisteredRoutes() {
    const routes = [];
    try {
        app._router.stack.forEach(middleware => {
            if (middleware.route) {
                const methods = Object.keys(middleware.route.methods).join(',').toUpperCase();
                routes.push({ path: middleware.route.path, methods });
            } else if (middleware.name === 'router' && middleware.handle && middleware.handle.stack) {
                middleware.handle.stack.forEach(handler => {
                    if (handler.route) {
                        const methods = Object.keys(handler.route.methods).join(',').toUpperCase();
                        routes.push({ path: handler.route.path, methods });
                    }
                });
            }
        });
    } catch (e) {
        // ignore errors here; return what we have
    }
    return routes;
}

function listRoutes() {
    try {
        const routes = getRegisteredRoutes();
        console.log('Registered routes:', routes);
    } catch (e) {
        console.warn('Could not list routes:', e && e.message);
    }
}


// Use path.resolve for static files for better OS compatibility
app.use(express.static(path.join(__dirname, "public")));

// Helper: calculate average rating
function calculateAverageRating(reviews) {
    if (!reviews || reviews.length === 0) return { avg: 0, count: 0 };
    const totalRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    return { avg: parseFloat((totalRating / reviews.length).toFixed(2)), count: reviews.length };
}

// --- MONGODB CONNECTION & SERVER START (FIX IMPLEMENTED HERE) ---

async function start() {
    try {
        if (MONGO_URI) {
            await mongoose.connect(MONGO_URI, {
                dbName: 'test' // try to use the configured DB name
            });
            console.log('MongoDB successfully connected to database: test! 🚀');
        } else {
            console.log('No MONGO_URI provided; skipping MongoDB connection and running in mock/dev mode.');
        }

        // List routes for debugging and then start the server
        listRoutes();

        app.listen(PORT, () => {
            console.log(`Server listening at http://localhost:${PORT}`);
        });
    } catch (err) {
        // If Mongo fails to connect for any reason, log the error but continue
        // to start the server so frontend development (including mock payment)
        // can continue.
        console.error('🚨 MongoDB connection error (continuing without DB):', err && err.message);
        console.warn('Continuing without MongoDB. DB-backed features will be disabled or may error if used.');

        try {
            listRoutes();
            app.listen(PORT, () => {
                console.log(`Server listening at http://localhost:${PORT} (no DB)`);
            });
        } catch (listenErr) {
            console.error('Failed to start server after MongoDB connection failure:', listenErr && listenErr.message);
            process.exit(1);
        }
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
        // If MongoDB isn't connected (dev/mock mode), return a small in-memory
        // product list so the frontend can continue to function during local
        // development. This prevents a 500 when the DB is unavailable.
        const isConnected = mongoose && mongoose.connection && mongoose.connection.readyState === 1;
        if (!isConnected) {
            // Lightweight mock products matching the frontend expectations
            const mockProducts = [
                {
                    _id: 'mock-prod-1',
                    name: 'Sample Mug',
                    discountedPrice: 299,
                    mrp: 499,
                    imageUrls: ['https://placehold.co/400x300?text=Sample+Mug'],
                    variants: [{ sku: 'MUG-BLK', variantName: 'Black', quantity: 12, variantPrice: 299 }]
                },
                {
                    _id: 'mock-prod-2',
                    name: 'Demo T-Shirt',
                    discountedPrice: 599,
                    mrp: 899,
                    imageUrls: ['https://placehold.co/400x300?text=Demo+T-Shirt'],
                    variants: [{ sku: 'TS-XS', variantName: 'Small', quantity: 8, variantPrice: 599 }]
                }
            ];
            return res.json(mockProducts);
        }

        // Use .lean() for faster read operations if full Mongoose documents aren't needed
        const products = await Product.find({}).lean(); 
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching products', error: err.message });
    }
});

// Get single product by id
app.get('/api/products/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Product.findById(id).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });
        return res.json(product);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching product', error: err.message });
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
        // Populate product references on items so frontend can show thumbnails and titles
        const orders = await Order.find({}).sort({ createdAt: -1 }).populate('items.productId').lean();

        // Augment each item's data with product/variant info when available.
        // If an order has no items (older orders), try to pull items from the
        // corresponding Payment record so the UI can show product thumbnails.
        const enriched = orders.map(order => {
            if ((!order.items || order.items.length === 0) && order.orderId) {
                try {
                    // find payment and copy items into the returned object (do not persist here)
                    const pay = (async () => {
                        try {
                            const p = await Payment.findOne({ orderId: order.orderId }).lean();
                            return p && p.items && p.items.length ? p.items : null;
                        } catch (e) {
                            return null;
                        }
                    })();
                    // we'll resolve below synchronously by awaiting the promise
                    // (map can't be async easily), so assign a temporary placeholder
                    order._maybePaymentItems = pay;
                } catch (e) {}
            }
            if (order.items && order.items.length) {
                    order.items = order.items.map(it => {
                        try {
                            const prod = it.productId;
                            // If Mongoose populated productId, use it
                            if (prod && typeof prod === 'object') {
                                const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                                return {
                                    ...it,
                                    name: it.name || prod.name,
                                    imageUrl: it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || prod.variantImage || null,
                                    variantName: it.variantName || (variant && variant.variantName) || it.variantName,
                                    price: it.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || it.price
                                };
                            }
                            // If productId exists but wasn't populated (string/ObjectId), we keep the
                            // placeholder for now; a later async pass will attempt to enrich it.
                        } catch (e) {
                            // ignore per-item enrich errors
                        }
                        return it;
                    });
                }
            return order;
        });

        // Resolve any pending payment-item fetches
            for (const o of enriched) {
                if ((!o.items || o.items.length === 0) && o._maybePaymentItems) {
                    try {
                        const pi = await o._maybePaymentItems;
                        if (pi && pi.length) {
                            // Enrich each payment-item by looking up product info when productId present
                            const enrichedItems = [];
                            for (const it of pi) {
                                let newIt = { ...it };
                                try {
                                    if (it.productId) {
                                        const prod = await Product.findById(it.productId).lean();
                                        if (prod) {
                                            const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                                            newIt.name = newIt.name || prod.name;
                                            newIt.imageUrl = newIt.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || newIt.imageUrl;
                                            newIt.variantName = newIt.variantName || (variant && variant.variantName) || newIt.variantName;
                                            newIt.price = newIt.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || newIt.price;
                                        }
                                    }
                                } catch (e) {
                                    // ignore per-item enrich error
                                }
                                enrichedItems.push(newIt);
                            }
                            o.items = enrichedItems;
                        } else {
                            // As a last-resort dev fallback: try to guess a product whose
                            // price roughly matches the order total. This helps older demo
                            // orders display something sensible in the UI.
                            try {
                                const guessed = await Product.findOne({
                                    $or: [
                                        { discountedPrice: o.totalAmount },
                                        { mrp: o.totalAmount }
                                    ]
                                }).lean();
                                if (guessed) {
                                    o.items = [{ productId: guessed._id, name: guessed.name, imageUrl: (guessed.imageUrls && guessed.imageUrls[0]) || null, price: o.totalAmount, quantity: 1, _synthetic: true }];
                                }
                            } catch (e) {}
                        }
                    } catch (e) {}
                    delete o._maybePaymentItems;
                }
            }

        // Second-pass async enrichment: for any order items that still lack imageUrl
        // try to fetch product info by productId (if unpopulated) or by variant SKU
        // or by price/name heuristics. This increases the chance thumbnails are
        // available to the frontend even for older or partially-snapshotted orders.
        for (const o of enriched) {
            if (!o.items || !o.items.length) continue;
            for (const it of o.items) {
                try {
                    if (it.imageUrl) continue; // already has image

                    // If productId is present but not populated, try to fetch it
                    if (it.productId) {
                        try {
                            const prod = await Product.findById(it.productId).lean();
                            if (prod) {
                                const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prod.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || it.price;
                                continue;
                            }
                        } catch (e) {
                            // ignore and fall through to other heuristics
                        }
                    }

                    // Try to find a product by variant SKU (common when productId wasn't saved)
                    if (it.variantSku) {
                        try {
                            const prodBySku = await Product.findOne({ 'variants.sku': it.variantSku }).lean();
                            if (prodBySku) {
                                const variant = (prodBySku.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prodBySku.imageUrls && prodBySku.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prodBySku.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prodBySku.discountedPrice || prodBySku.mrp || it.price;
                                continue;
                            }
                        } catch (e) {}
                    }

                    // Price-based heuristic fallback
                    if (!it.imageUrl && it.price) {
                        try {
                            const guessed = await Product.findOne({ $or: [{ discountedPrice: it.price }, { mrp: it.price }] }).lean();
                            if (guessed) {
                                it.imageUrl = it.imageUrl || (guessed.imageUrls && guessed.imageUrls[0]) || null;
                                it.name = it.name || guessed.name;
                            }
                        } catch (e) {}
                    }
                } catch (e) {
                    // ignore per-item errors
                }
            }
        }

        res.json(enriched);
    } catch (err) {
        res.status(500).json({ message: 'Error fetching orders', error: err.message });
    }
});

// Get single order by id
app.get('/api/orders/:id', async (req, res) => {
    try {
        const id = req.params.id;
        // Accept either a Mongo _id or a Razorpay orderId (e.g. order_XXX).
        // Prefer a direct orderId lookup for values that look like Razorpay ids
        // (e.g. start with "order_") to avoid Mongoose attempting to cast
        // a non-ObjectId string and throwing a CastError.
        let order = null;

        // If the id clearly looks like a Razorpay order id, use orderId lookup first
        if (typeof id === 'string' && id.startsWith('order_')) {
            order = await Order.findOne({ orderId: id }).populate('items.productId').lean();
        } else {
            // Otherwise, attempt an ObjectId lookup if the id is a valid ObjectId.
            if (mongoose.Types.ObjectId.isValid(id)) {
                try {
                    order = await Order.findById(id).populate('items.productId').lean();
                } catch (e) {
                    // If cast or other error occurs, null out and fall back to orderId below
                    order = null;
                }
            }
            // If still not found, attempt to match by orderId as a fallback
            if (!order) {
                order = await Order.findOne({ orderId: id }).populate('items.productId').lean();
            }
        }

        if (!order) return res.status(404).json({ message: 'Order not found' });

        if ((!order.items || order.items.length === 0) && order.orderId) {
            try {
                const pay = await Payment.findOne({ orderId: order.orderId }).lean();
                if (pay && pay.items && pay.items.length) {
                    const enrichedItems = [];
                    for (const it of pay.items) {
                        let newIt = { ...it };
                        try {
                            if (it.productId) {
                                const prod = await Product.findById(it.productId).lean();
                                if (prod) {
                                    const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                                    newIt.name = newIt.name || prod.name;
                                    newIt.imageUrl = newIt.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || newIt.imageUrl;
                                    newIt.variantName = newIt.variantName || (variant && variant.variantName) || newIt.variantName;
                                    newIt.price = newIt.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || newIt.price;
                                }
                            }
                        } catch (e) {}
                        enrichedItems.push(newIt);
                    }
                    order.items = enrichedItems;
                } else {
                    // dev fallback: try to guess a product by price
                    try {
                        const guessed = await Product.findOne({
                            $or: [ { discountedPrice: order.totalAmount }, { mrp: order.totalAmount } ]
                        }).lean();
                        if (guessed) {
                            order.items = [{ productId: guessed._id, name: guessed.name, imageUrl: (guessed.imageUrls && guessed.imageUrls[0]) || null, price: order.totalAmount, quantity: 1, _synthetic: true }];
                        }
                    } catch (e) {}
                }
            } catch (e) {
                // ignore
            }
        }

        if (order.items && order.items.length) {
            order.items = order.items.map(it => {
                try {
                    const prod = it.productId;
                    if (prod && typeof prod === 'object') {
                        const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                        return {
                            ...it,
                            name: it.name || prod.name,
                            imageUrl: it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || prod.variantImage || null,
                            variantName: it.variantName || (variant && variant.variantName) || it.variantName,
                            price: it.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || it.price
                        };
                    }
                } catch (e) {
                    // ignore enrichment error per-item
                }
                return it;
            });
        }

        // Second-pass enrichment for single order: try product lookups when
        // items still lack imageUrl (productId unpopulated, variantSku lookup, price heuristic)
        if (order.items && order.items.length) {
            for (const it of order.items) {
                try {
                    if (it.imageUrl) continue;
                    if (it.productId) {
                        try {
                            const prod = await Product.findById(it.productId).lean();
                            if (prod) {
                                const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prod.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prod.discountedPrice || prod.mrp || it.price;
                                continue;
                            }
                        } catch (e) {}
                    }
                    if (it.variantSku) {
                        try {
                            const prodBySku = await Product.findOne({ 'variants.sku': it.variantSku }).lean();
                            if (prodBySku) {
                                const variant = (prodBySku.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prodBySku.imageUrls && prodBySku.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prodBySku.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prodBySku.discountedPrice || prodBySku.mrp || it.price;
                                continue;
                            }
                        } catch (e) {}
                    }
                    if (!it.imageUrl && it.price) {
                        try {
                            const guessed = await Product.findOne({ $or: [{ discountedPrice: it.price }, { mrp: it.price }] }).lean();
                            if (guessed) {
                                it.imageUrl = it.imageUrl || (guessed.imageUrls && guessed.imageUrls[0]) || null;
                                it.name = it.name || guessed.name;
                            }
                        } catch (e) {}
                    }
                } catch (e) {}
            }
        }

        return res.json(order);
    } catch (err) {
        return res.status(500).json({ message: 'Error fetching order', error: err.message });
    }
});

// ADMIN / DEBUG: Backfill an Order's items from the corresponding Payment record
// Useful for local/dev to repair older orders that were created before items
// snapshotting was implemented.
app.post('/api/orders/:id/backfill-from-payment', async (req, res) => {
    try {
        const id = req.params.id;
        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        // If order already has items, do nothing
        if (order.items && order.items.length) {
            return res.json({ message: 'Order already has items', order });
        }

        // Try to find a Payment that references this orderId
        const payment = await mongoose.model('Payment').findOne({ orderId: order.orderId }).lean();
        if (!payment || !payment.items || payment.items.length === 0) {
            return res.status(404).json({ message: 'No payment items found to backfill' });
        }

        // Assign items from payment to order and save
        order.items = payment.items;
        await order.save();

        // Return the updated order (enriched)
        const updated = await Order.findById(order._id).populate('items.productId').lean();
        return res.json({ message: 'Order backfilled from payment items', order: updated });
    } catch (err) {
        return res.status(500).json({ message: 'Error backfilling order', error: err.message });
    }
});

// ADMIN: set a product on an order (useful for demo/backfilling)
app.post('/api/orders/:id/set-product', async (req, res) => {
    try {
        const id = req.params.id;
        const { productId, quantity = 1, price } = req.body || {};
        if (!productId) return res.status(400).json({ message: 'productId is required' });

        const product = await Product.findById(productId).lean();
        if (!product) return res.status(404).json({ message: 'Product not found' });

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.items = [{ productId: product._id, variantSku: product.variants?.[0]?.sku || '', variantName: product.variants?.[0]?.variantName || '', name: product.name, price: price || product.discountedPrice || product.mrp || 0, quantity }];
        await order.save();

        const updated = await Order.findById(id).populate('items.productId').lean();
        return res.json({ message: 'Order updated with product', order: updated });
    } catch (e) {
        return res.status(500).json({ message: 'Error updating order', error: e.message });
    }
});

// ADMIN: set shipping details on an order (useful for demo/backfilling delivery address)
app.post('/api/orders/:id/set-shipping', async (req, res) => {
    try {
        const id = req.params.id;
        const { name, email, street, city, zip } = req.body || {};
        if (!name && !email && !street && !city && !zip) return res.status(400).json({ message: 'At least one shipping field is required' });

        const order = await Order.findById(id);
        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.shipping = order.shipping || {};
        if (name) order.shipping.name = name;
        if (email) order.shipping.email = email;
        if (street) order.shipping.street = street;
        if (city) order.shipping.city = city;
        if (zip) order.shipping.zip = zip;

        await order.save();

        const updated = await Order.findById(id).populate('items.productId').lean();
        return res.json({ message: 'Order shipping updated', order: updated });
    } catch (e) {
        return res.status(500).json({ message: 'Error updating shipping', error: e.message });
    }
});

// Cancel an order (user-initiated cancel). Accepts either Mongo _id or Razorpay orderId
app.post('/api/orders/:id/cancel', async (req, res) => {
    try {
        const id = req.params.id;
        let order = null;

        // Try ObjectId lookup first when possible
        if (mongoose.Types.ObjectId.isValid(id)) {
            order = await Order.findById(id);
        }
        // fallback to orderId lookup
        if (!order) {
            order = await Order.findOne({ orderId: id });
        }

        // If we couldn't find an Order, try to locate a Payment with this id
        if (!order) {
            try {
                let payment = null;
                if (mongoose.Types.ObjectId.isValid(id)) {
                    payment = await Payment.findById(id).lean();
                }
                if (!payment) payment = await Payment.findOne({ orderId: id }).lean();

                if (!payment) return res.status(404).json({ message: 'Order not found', error: 'Not found' });

                // Build a new Order document from the payment snapshot and mark cancelled
                const newOrder = new Order({
                    userId: payment.userId || null,
                    userEmail: payment.userEmail || null,
                    orderId: payment.orderId || null,
                    paymentId: payment.paymentId || null,
                    items: payment.items || [],
                    totalAmount: payment.amount || 0,
                    shipping: payment.shipping || null,
                    deliveryAddress: payment.deliveryAddress || null,
                    paymentStatus: 'Failed',
                    orderStatus: 'Cancelled',
                    paymentEvents: [{ timestamp: new Date(), status: 'Failure', details: 'Cancelled by user (created from payment)' }]
                });

                await newOrder.save();

                const populated = await Order.findById(newOrder._id).populate('items.productId').lean();
                return res.json({ message: 'Order cancelled (created from payment snapshot)', order: populated });
            } catch (e) {
                return res.status(500).json({ message: 'Error creating/cancelling order from payment', error: e.message });
            }
        }

        // Only allow cancel when order not already shipped/delivered/cancelled
        if (order.orderStatus === 'Shipped' || order.orderStatus === 'Delivered' || order.orderStatus === 'Cancelled') {
            return res.status(400).json({ message: `Order cannot be cancelled (current status: ${order.orderStatus})` });
        }

        // Mark cancelled and record a payment event
        order.orderStatus = 'Cancelled';
        order.paymentEvents = order.paymentEvents || [];
        order.paymentEvents.push({ timestamp: new Date(), status: 'Failure', details: 'Cancelled by user' });
        order.paymentStatus = 'Failed';

        await order.save();

        // Return populated/enriched order for frontend convenience
        const updated = await Order.findById(order._id).populate('items.productId').lean();
        return res.json({ message: 'Order cancelled', order: updated });
    } catch (e) {
        return res.status(500).json({ message: 'Error cancelling order', error: e.message });
    }
});

// Mount payment routes (moved here so route listing shows them reliably)
app.use("/api/payment", paymentRoutes);

// (Moved) Generic JSON 404 for any unmatched /api/* requests will be added after
// all API routes are registered so it doesn't intercept valid endpoints.

// Debug endpoint: return registered routes so we can confirm which routes the
// running server actually has mounted. Useful when multiple processes/servers
// may be listening on the same ports during development.
app.get('/debug/routes', (req, res) => {
    try {
        const routes = getRegisteredRoutes();
        return res.json({ routes });
    } catch (err) {
        return res.status(500).json({ error: 'Could not enumerate routes', message: err && err.message });
    }
});

// ADMIN DEBUG: backfill shipping for all orders from Payment records
app.post('/api/debug/backfill-shipping', async (req, res) => {
    try {
        const orders = await Order.find({ $or: [ { shipping: { $exists: false } }, { shipping: null } ] }).lean();
        let updated = 0;
        const details = [];
        for (const o of orders) {
            if (!o.orderId) continue;
            try {
                const p = await Payment.findOne({ orderId: o.orderId }).lean();
                const update = {};
                let willUpdate = false;
                if (p && p.shipping) {
                    update.shipping = p.shipping;
                    willUpdate = true;
                }
                // If the payment record has the new structured delivery address,
                // copy it into the Order.deliveryAddress field as well.
                if (p && p.deliveryAddress) {
                    update.deliveryAddress = p.deliveryAddress;
                    willUpdate = true;
                }
                if (willUpdate) {
                    await Order.findByIdAndUpdate(o._id, update);
                    updated++;
                    details.push({ orderId: o._id, fromPayment: true });
                }
            } catch (e) {
                // ignore per-order errors
                details.push({ orderId: o._id, error: e.message });
            }
        }
        return res.json({ message: 'Backfill complete', totalOrders: orders.length, updated, details });
    } catch (e) {
        return res.status(500).json({ message: 'Error running backfill', error: e.message });
    }
});

// Simple health check for API reachability
app.get('/api/health', (req, res) => {
    return res.json({ ok: true, uptime: process.uptime(), now: new Date().toISOString() });
});
// DEBUG: get payment by orderId
app.get('/api/debug/payment/:orderId', async (req, res) => {
    try {
        const param = req.params.orderId;
        // Try lookup by orderId first (common case), then by Payment._id as a fallback.
        let p = null;
        try {
            p = await Payment.findOne({ orderId: param }).lean();
        } catch (e) {
            // ignore and try id lookup
        }
        if (!p) {
            // If param looks like an ObjectId, try to find by _id
            if (param && param.length === 24) {
                try {
                    p = await Payment.findById(param).lean();
                } catch (e) {
                    // ignore
                }
            }
        }
        if (!p) return res.status(404).json({ message: 'Payment not found' });

        // Enrich payment items with product metadata when possible so single
        // payment lookup also returns imageUrl/variantName for UI rendering.
        if (p.items && p.items.length) {
            for (const it of p.items) {
                try {
                    if (it.productId) {
                        const prod = await Product.findById(it.productId).lean();
                        if (prod) {
                            const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                            it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || null;
                            it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                            it.name = it.name || prod.name;
                        }
                    }
                } catch (e) {
                    // ignore per-item errors
                }
            }
        }

        // Additional heuristics when an item still lacks an image: try variant SKU
        // lookup or price-based guessing to provide a thumbnail for the UI.
        if (p.items && p.items.length) {
            for (const it of p.items) {
                try {
                    if (it.imageUrl) continue;
                    if (it.variantSku) {
                        try {
                            const prodBySku = await Product.findOne({ 'variants.sku': it.variantSku }).lean();
                            if (prodBySku) {
                                const variant = (prodBySku.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prodBySku.imageUrls && prodBySku.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prodBySku.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prodBySku.discountedPrice || prodBySku.mrp || it.price;
                                continue;
                            }
                        } catch (e) {}
                    }
                    if (!it.imageUrl && it.price) {
                        try {
                            const guessed = await Product.findOne({ $or: [{ discountedPrice: it.price }, { mrp: it.price }] }).lean();
                            if (guessed) {
                                it.imageUrl = it.imageUrl || (guessed.imageUrls && guessed.imageUrls[0]) || null;
                                it.name = it.name || guessed.name;
                            }
                        } catch (e) {}
                    }
                } catch (e) {
                    // ignore
                }
            }
        }

        return res.json(p);
    } catch (e) {
        return res.status(500).json({ message: 'Error fetching payment', error: e.message });
    }
});

// DEBUG: list payments for a user (by userId or email) - used by frontend
app.get('/api/debug/payments', async (req, res) => {
    try {
        const { userId, email } = req.query;
        if (!userId && !email) return res.status(400).json({ message: 'userId or email required' });
        const q = { $or: [] };
        if (userId) q.$or.push({ userId });
        if (email) q.$or.push({ userEmail: email });
        let payments = await Payment.find(q).sort({ createdAt: -1 }).lean();

        // Try to enrich each payment's items with product metadata (imageUrl,
        // variantName) when possible so the frontend can show thumbnails even
        // for payment-only records. We attempt to resolve by item.productId if
        // present, otherwise try a price-based heuristic.
        for (const p of payments) {
            if (!p.items || !p.items.length) continue;
            for (let i = 0; i < p.items.length; i++) {
                const it = p.items[i];
                try {
                    // If productId stored, fetch product details
                    if (it.productId) {
                        const prod = await Product.findById(it.productId).lean();
                        if (prod) {
                            const variant = (prod.variants || []).find(v => v.sku === it.variantSku);
                            it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prod.imageUrls && prod.imageUrls[0]) || null;
                            it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                            it.name = it.name || prod.name;
                            continue;
                        }
                    }

                    // Try variant SKU lookup when productId not available
                    if (it.variantSku) {
                        try {
                            const prodBySku = await Product.findOne({ 'variants.sku': it.variantSku }).lean();
                            if (prodBySku) {
                                const variant = (prodBySku.variants || []).find(v => v.sku === it.variantSku);
                                it.imageUrl = it.imageUrl || (variant && variant.variantImage) || (prodBySku.imageUrls && prodBySku.imageUrls[0]) || it.imageUrl || null;
                                it.name = it.name || prodBySku.name;
                                it.variantName = it.variantName || (variant && variant.variantName) || it.variantName;
                                it.price = it.price || (variant && variant.variantPrice) || prodBySku.discountedPrice || prodBySku.mrp || it.price;
                                continue;
                            }
                        } catch (e) {}
                    }

                    // Heuristic: try to find a product whose price matches the item
                    if (!it.imageUrl && it.price) {
                        const guessed = await Product.findOne({ $or: [ { discountedPrice: it.price }, { mrp: it.price } ] }).lean();
                        if (guessed) {
                            it.imageUrl = (guessed.imageUrls && guessed.imageUrls[0]) || null;
                            it.name = it.name || guessed.name;
                        }
                    }
                } catch (e) {
                    // ignore enrichment errors per-item
                }
            }
        }

        return res.json(payments);
    } catch (e) {
        return res.status(500).json({ message: 'Error fetching payments', error: e.message });
    }
});

// ADMIN/DEBUG: Ensure an Order exists for a payment (backfill).
// POST /api/payment/ensure-order/:orderId
app.post('/api/payment/ensure-order/:orderId', async (req, res) => {
    try {
        const param = req.params.orderId;
        // Find payment by orderId or by Payment._id
        let payment = await Payment.findOne({ orderId: param }).lean();
        if (!payment && param && param.length === 24) {
            payment = await Payment.findById(param).lean();
        }
        if (!payment) return res.status(404).json({ message: 'Payment not found' });

        // If Order already exists for this orderId, return it
        const existing = await Order.findOne({ orderId: payment.orderId }).lean();
        if (existing) return res.json({ message: 'Order already exists', order: existing });

        // Normalize items and payment events before creating the Order document
        const normalizedItems = [];
        if (payment.items && Array.isArray(payment.items)) {
            for (const it of payment.items) {
                try {
                    let variantSku = it.variantSku || '';
                    let variantName = it.variantName || '';
                    let name = it.name || '';
                    let price = (typeof it.price === 'number') ? it.price : (it.price ? Number(it.price) : 0);
                    const quantity = (typeof it.quantity === 'number' && it.quantity > 0) ? it.quantity : (it.quantity ? Number(it.quantity) : 1);

                    // If productId is present, try to enrich missing fields from the Product/variants
                    if ((!variantSku || !variantName || !name || !price) && it.productId) {
                        try {
                            const prod = await Product.findById(it.productId).lean();
                            if (prod) {
                                // Try to find a matching variant by sku if provided, else pick first variant
                                let matchedVariant = null;
                                if (variantSku) matchedVariant = (prod.variants || []).find(v => v.sku === variantSku);
                                if (!matchedVariant && prod.variants && prod.variants.length) matchedVariant = prod.variants[0];

                                if (!variantSku && matchedVariant) variantSku = matchedVariant.sku || variantSku;
                                if (!variantName && matchedVariant) variantName = matchedVariant.variantName || variantName;
                                if (!variantName && !matchedVariant && prod.variants && prod.variants.length === 1) variantName = prod.variants[0].variantName || variantName;
                                name = name || prod.name;
                                price = price || (matchedVariant && matchedVariant.variantPrice) || prod.discountedPrice || prod.mrp || price;
                            }
                        } catch (e) {
                            // ignore per-item enrichment failure
                        }
                    }

                    // If we still lack variantName but have a sku, try to find product by sku
                    if (!variantName && variantSku) {
                        try {
                            const prodBySku = await Product.findOne({ 'variants.sku': variantSku }).lean();
                            if (prodBySku) {
                                const v = (prodBySku.variants || []).find(vv => vv.sku === variantSku);
                                if (v) variantName = v.variantName || variantName;
                                name = name || prodBySku.name;
                                price = price || v?.variantPrice || prodBySku.discountedPrice || prodBySku.mrp || price;
                            }
                        } catch (e) {}
                    }

                    // Fallbacks to satisfy Order schema required fields (non-empty SKU required)
                    if (!variantSku) variantSku = `unknown_sku_${Date.now()}`;
                    variantName = variantName || 'Default Variant';
                    name = name || 'Unknown Product';
                    price = price || 0;

                    normalizedItems.push({ productId: it.productId || undefined, variantSku, variantName, name, price, quantity });
                } catch (e) {
                    // if item processing fails, push a minimal placeholder so validation can run
                    normalizedItems.push({ productId: it.productId || undefined, variantSku: '', variantName: 'Default Variant', name: it.name || 'Unknown', price: Number(it.price) || 0, quantity: Number(it.quantity) || 1 });
                }
            }
        }

        // Normalize paymentEvents to match Order.paymentEvents schema enum: ['Attempt','Success','Failure']
        const mapEventStatus = s => {
            if (!s) return 'Attempt';
            const low = String(s).toLowerCase();
            if (low === 'paid' || low === 'success' || low === 'succeeded') return 'Success';
            if (low === 'failed' || low === 'failure' || low === 'error') return 'Failure';
            if (low === 'created' || low === 'attempt' || low === 'pending') return 'Attempt';
            return 'Attempt';
        };

        const normalizedPaymentEvents = [];
        if (payment.paymentEvents && Array.isArray(payment.paymentEvents) && payment.paymentEvents.length) {
            for (const ev of payment.paymentEvents) {
                try {
                    normalizedPaymentEvents.push({ timestamp: ev.timestamp ? new Date(ev.timestamp) : new Date(), status: mapEventStatus(ev.status), details: ev.details || (ev.message || '') });
                } catch (e) {
                    normalizedPaymentEvents.push({ timestamp: new Date(), status: 'Attempt', details: 'Imported event' });
                }
            }
        } else {
            normalizedPaymentEvents.push({ timestamp: new Date(), status: mapEventStatus(payment.status), details: 'Backfilled from Payment' });
        }

        // Build new Order document from Payment record using normalized data
        const orderDoc = new Order({
            userId: payment.userId || 'demo_user_12345',
            orderId: payment.orderId || payment._id,
            paymentId: payment.paymentId || null,
            userEmail: payment.userEmail || null,
            status: payment.status === 'paid' ? 'paid' : (payment.status || 'created'),
            items: normalizedItems,
            shipping: payment.shipping || undefined,
            deliveryAddress: payment.deliveryAddress || undefined,
            totalAmount: Number(payment.amount) || 0,
            paymentStatus: (mapEventStatus(payment.status) === 'Success') ? 'Paid' : (mapEventStatus(payment.status) === 'Failure' ? 'Failed' : 'Pending'),
            paymentEvents: normalizedPaymentEvents,
            orderStatus: 'Processing'
        });

        const saved = await orderDoc.save();

        // Try to decrement stock for each item atomically where possible
        if (saved.items && saved.items.length) {
            for (const it of saved.items) {
                try {
                    if (it.productId && it.variantSku && it.quantity) {
                        const upd = await Product.updateOne(
                            { _id: it.productId, 'variants.sku': it.variantSku, 'variants.quantity': { $gte: it.quantity } },
                            { $inc: { 'variants.$.quantity': -it.quantity } }
                        ).exec();
                        // If upd.nModified === 0 then stock couldn't be decremented (insufficient or missing)
                        // We don't fail the request; admin can see and act on low stock.
                    }
                } catch (e) {
                    // ignore per-item failures
                }
            }
        }

        return res.json({ message: 'Order created from Payment', order: saved });
    } catch (e) {
        console.error('ensure-order error', e);
        console.error(e && (e.stack || e));
        return res.status(500).json({ message: 'Error ensuring order', error: e.message });
    }
});

// Generic JSON 404 for any unmatched /api/* requests (all methods).
app.use('/api', (req, res) => {
    return res.status(404).json({ error: 'Not found' });
});

// Fallback for frontend (serve index.html for non-API routes)
app.get(/.*/, (req, res) => {
    // Serve the main index file for all other paths
    res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Start the server
start();
