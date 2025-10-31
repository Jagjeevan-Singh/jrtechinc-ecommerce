const mongoose = require('mongoose');

// --- SUB-SCHEMAS ---

// Sub-schema for Product Variants (Size, Color, etc.)
const ProductVariantSchema = new mongoose.Schema({
    sku: { // Stock Keeping Unit
        type: String,
        required: true,
        unique: false, // CORRECT: Fixes E11000 error when variants array is empty
        trim: true
    },
    variantName: { // e.g., "White", "Sky Blue"
        type: String,
        required: true,
        trim: true
    },
    quantity: { // Inventory for this specific variant
        type: Number,
        required: true,
        min: 0,
        default: 0,
    },
    // --- DYNAMIC VARIANT FIELDS ---
    variantImage: { 
        type: String,
        required: false
    },
    variantPrice: { 
        type: Number,
        required: false
    }
    // ------------------------------
});

// Sub-schema for structured details like "What's In The Box"
const DetailItemSchema = new mongoose.Schema({
    icon: { type: String, required: false }, 
    detail: { type: String, required: true }
});

// Sub-schema for User Reviews and Ratings (No Change)
const ReviewSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    review: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

// Sub-schema for Payment Events (Tracking retries and final status) (No Change)
const PaymentEventSchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now },
    status: { type: String, enum: ['Attempt', 'Success', 'Failure'], required: true },
    details: { type: String, default: '' },
});

// --- MAIN SCHEMAS ---

// --- 1. PRODUCT SCHEMA ---
const ProductSchema = new mongoose.Schema(
    {
        name: { type: String, required: true, trim: true },
        
        category: { type: String, trim: true }, 
        description: { type: String, trim: true }, 

        // Base Pricing (used if variantPrice is null)
        mrp: { type: Number, min: 0 }, 
        discountedPrice: { type: Number, min: 0 }, 

        // --- CRITICAL FIX: Images (Increased limit to 8) ---
        imageUrls: {
            type: [String],
            validate: {
                validator: (arr) => arr.length <= 8, // MAX SET TO 8
                message: props => `${props.value.length} images provided, maximum 8 allowed!`
            },
            default: ['https://placehold.co/400x300/F0F0F0/333?text=Placeholder+Image'],
        },

        // --- NEW FIELD: Content Gallery (A+ Content) ---
        contentGallery: {
            type: [String],
            required: false 
        },
        // --- NEW FIELD: Structured Details (What's in the Box) ---
        productDetails: {
            type: [DetailItemSchema],
            required: false
        },
        // -----------------------------------------------------

        // Variants (Inventory is managed here)
        variants: { 
            type: [ProductVariantSchema],
            required: false 
        },

        // Ratings (Calculated fields)
        averageRating: { type: Number, default: 0, min: 0, max: 5 },
        reviewCount: { type: Number, default: 0, min: 0 },
        reviews: [ReviewSchema],
    },
    {
        timestamps: true,
    }
);

// Virtual property for current selling price
ProductSchema.virtual('price').get(function() {
    return this.discountedPrice || 0;
});

// --- 2. CART SCHEMA (No Change) ---
const CartItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variantSku: { type: String, required: true },
    variantName: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: {
        type: Number,
        required: true,
        min: 1,
        default: 1,
    },
});

const CartSchema = new mongoose.Schema({
    userId: { type: String, required: true, unique: true },
    items: [CartItemSchema],
    total: { type: Number, default: 0, min: 0 },
}, { timestamps: true });


// --- 3. ORDER SCHEMA (No Change) ---
// Sub-schema for Contact and Shipping Address
const ShippingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    zip: { type: String, required: true },
});

const OrderItemSchema = new mongoose.Schema({
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    variantSku: { type: String, required: true },
    variantName: { type: String, required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
});

const OrderSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    items: [OrderItemSchema],
    totalAmount: { type: Number, required: true, min: 0 },

    shipping: { type: ShippingAddressSchema, required: true }, 

    // Enhanced Payment Tracking
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed', 'Successful After Retry'],
        default: 'Pending'
    },
    paymentEvents: [PaymentEventSchema],

    orderStatus: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], default: 'Processing' },
}, { timestamps: true });


// Create Models
const Product = mongoose.model('Product', ProductSchema);
const Cart = mongoose.model('Cart', CartSchema);
const Order = mongoose.model('Order', OrderSchema);

module.exports = { Product, Cart, Order };