import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String, default: null },
  // Make userEmail optional so server-side order creation does not fail
  // when the frontend does not send an email (useful for guest checkout/dev).
  // Optional user identifier (e.g. Firebase uid) — added so Orders created
  // from Payments can be associated with a logged-in user.
  userId: { type: String, required: false },
  userEmail: { type: String, required: false },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    receipt: { type: String, required: true },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    // Optional items snapshot (saved at order creation time) to allow Order
    // reconstruction even if products change later. Each item mirrors the
    // OrderItemSchema used by orders.
    items: [{
      productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: false },
      variantSku: { type: String, required: false },
      variantName: { type: String, required: false },
      name: { type: String, required: false },
      price: { type: Number, required: false },
      quantity: { type: Number, required: false }
    }],
      // Optional shipping snapshot to allow Orders to include delivery address
      shipping: {
        name: { type: String, required: false },
        email: { type: String, required: false },
        street: { type: String, required: false },
        city: { type: String, required: false },
        zip: { type: String, required: false }
      }

      // Optional structured delivery address snapshot (mirrors new Order.deliveryAddress)
      , deliveryAddress: {
        fullName: { type: String, required: false },
        phone: { type: String, required: false },
        street: { type: String, required: false },
        city: { type: String, required: false },
        state: { type: String, required: false },
        postalCode: { type: String, required: false }
      }
  },
  { timestamps: true }
);

const Payment = mongoose.model("Payment", paymentSchema);

export default Payment;