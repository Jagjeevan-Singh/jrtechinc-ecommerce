// models/Order.js
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  items: [{ 
    productId: String,
    name: String,
    price: Number,
    quantity: Number,
    variant: String
  }],
  amount: { type: Number, required: true }, // paise or rupees? we'll store paise (integer)
  currency: { type: String, default: 'INR' },
  receipt: { type: String },
  razorpay_order_id: { type: String },
  razorpay_payment_id: { type: String },
  razorpay_signature: { type: String },
  status: { type: String, enum: ['created','attempted','paid','failed','refunded'], default: 'created' },
  createdAt: { type: Date, default: Date.now },
  notes: { type: Object }
});

export default mongoose.model('Order', OrderSchema);
