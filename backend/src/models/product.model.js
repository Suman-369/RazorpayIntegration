const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  image: { type: String, required: true },
  title: { type: String, required: true },
  price: {
    amount: {
      type: Number,
      min: [0, "Price cannot be negative"],
      required: true,
    },
    currency: {
      type: String,
      default: "INR",
      enum: ["INR", "USD"],
      required: true,
    },
  },
  description: { type: String, required: true },
});
const ProductModel = mongoose.model("Product", productSchema);

module.exports = ProductModel;
