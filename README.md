# Razorpay Payment Integration with Express.js

This repository shows how to integrate Razorpay payments into an Express.js backend and a simple frontend (vanilla HTML or React). It includes creating orders, handling payments, verifying signatures, and storing payment records in MongoDB.

## Prerequisites

- Node.js installed
- MongoDB installed and running (or use a hosted MongoDB URI)
- Razorpay account (for API key id and secret)

## What this guide includes

- Backend: create orders and verify payments using Razorpay SDK and Express.js
- MongoDB: save and update payment records (Mongoose)
- Frontend: simple checkout flow (vanilla HTML + React example)

## Files and structure (example)

- `backend/` - Express backend

  - `server.js` - entry point
  - `src/app.js` - Express app
  - `src/controllers/payment.controller.js` - payment routes and logic
  - `src/models/payment.model.js` - Mongoose Payment model
  - `src/db/db.js` - MongoDB connection
  - `src/routes/payment.routes.js` - payment routes

- `frontend/` - example React frontend
  - `src/PaymentButton.jsx` - Razorpay payment button component

---

## 1. Install Razorpay SDK

In the backend folder run:

```powershell
cd backend
npm install razorpay axios express mongoose dotenv
```

(Adjust packages to your project's needs.)

## 2. Backend: create Razorpay instance

In your backend startup file (e.g. `server.js` or `src/app.js`):

```js
require("dotenv").config();
const Razorpay = require("razorpay");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});
```

Be sure to add your keys to `.env` (example below).

## 3. MongoDB connection

Using Mongoose (example `src/db/db.js`):

```js
const mongoose = require("mongoose");

mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error", err));
```

## 4. Payment model (Mongoose)

Create `src/models/payment.model.js` (or `models/Payment.js`):

```js
const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    paymentId: { type: String },
    signature: { type: String },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payment", paymentSchema);
```

## 5. Create order endpoint

Example Express route to create an order (`POST /api/payment/orders`):

```js
// create order
router.post("/orders", async (req, res) => {
  const { amount } = req.body; // amount in INR
  const options = {
    amount: amount * 100, // convert to paisa (smallest unit)
    currency: "INR",
  };

  try {
    const order = await razorpay.orders.create(options);

    // save order record
    await Payment.create({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: "pending",
    });

    res.json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Unable to create order" });
  }
});
```

Notes:

- The `amount` sent to Razorpay must be in the smallest currency unit (paise for INR).

## 6. Frontend: include Razorpay checkout script

In your checkout page (vanilla HTML) or `public/index.html` for React, add in `<head>`:

```html
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
```

## 7. Frontend: create order and open Razorpay

Vanilla HTML example (button click):

```html
<button id="rzp-button1">Pay with Razorpay</button>
<script>
  document.getElementById("rzp-button1").onclick = function (e) {
    axios
      .post("/api/payment/orders", { amount: 500 })
      .then(function (response) {
        var options = {
          key: "YOUR_RAZORPAY_KEY_ID",
          amount: response.data.amount,
          currency: response.data.currency,
          name: "YOUR_COMPANY_NAME",
          order_id: response.data.id,
          handler: function (res) {
            // send verification request to backend
            axios
              .post("/api/payment/verify", {
                razorpayOrderId: res.razorpay_order_id,
                razorpayPaymentId: res.razorpay_payment_id,
                signature: res.razorpay_signature,
              })
              .then(() => alert("Payment verified"))
              .catch(() => alert("Verification failed"));
          },
        };
        var rzp1 = new Razorpay(options);
        rzp1.open();
      })
      .catch(console.error);
  };
</script>
```

## 8. Verify payment on backend

Use the Razorpay utility to verify the signature server-side. Example route (`POST /api/payment/verify`):

```js
const crypto = require("crypto");

router.post("/verify", async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, signature } = req.body;
  const secret = process.env.RAZORPAY_KEY_SECRET;

  // compute expected signature
  const generatedSignature = crypto
    .createHmac("sha256", secret)
    .update(razorpayOrderId + "|" + razorpayPaymentId)
    .digest("hex");

  if (generatedSignature === signature) {
    const payment = await Payment.findOne({ orderId: razorpayOrderId });
    if (payment) {
      payment.paymentId = razorpayPaymentId;
      payment.signature = signature;
      payment.status = "completed";
      await payment.save();
    }
    return res.json({ status: "success" });
  }

  return res.status(400).json({ error: "Invalid signature" });
});
```

Notes:

- This example uses Node's `crypto` to validate the signature (recommended).
- Older examples import from the Razorpay package internals; avoid that — compute the HMAC yourself.

## 9. React frontend example

Install axios in `frontend/`:

```powershell
cd frontend
npm install axios
```

`src/PaymentButton.jsx`:

```jsx
import React from "react";
import axios from "axios";

function PaymentButton() {
  const handlePayment = async () => {
    try {
      const { data: order } = await axios.post(
        "http://localhost:5000/api/payment/orders",
        { amount: 500 }
      );

      const options = {
        key: process.env.REACT_APP_RAZORPAY_KEY_ID || "YOUR_KEY_ID",
        amount: order.amount,
        currency: order.currency,
        name: "My Company",
        order_id: order.id,
        handler: async function (response) {
          const { razorpay_order_id, razorpay_payment_id, razorpay_signature } =
            response;
          await axios.post("http://localhost:5000/api/payment/verify", {
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            signature: razorpay_signature,
          });
          alert("Payment successful");
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <button onClick={handlePayment} style={{ padding: "10px 20px" }}>
      Pay Now
    </button>
  );
}

export default PaymentButton;
```

## 10. .env example

Create a `.env` file in `backend/`:

```
RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXX
MONGODB_URI=mongodb://localhost:27017/razorpay_demo
PORT=5000
```

## Endpoints summary

- POST /api/payment/orders -> creates Razorpay order
- POST /api/payment/verify -> verifies payment signature and updates DB

## PowerShell: run backend and frontend

Backend:

```powershell
cd backend; npm install; npm start
```

Frontend (React via Vite or CRA):

```powershell
cd frontend; npm install; npm run dev
```

## Troubleshooting

- 400/401 from Razorpay: check key_id/key_secret and account permissions
- Invalid signature: ensure order_id & payment_id are used in HMAC exactly in the format "order_id|payment_id" and secret is correct
- CORS issues: enable CORS on backend or proxy requests from frontend

## Security notes

- Never expose your `key_secret` on the client. Only `key_id` may be referenced on the client.
- Use HTTPS in production.

## Completion

This README summarizes the integration steps you provided, adapts them to a safe verification approach (Node's crypto), and documents run commands and an example `.env`.
