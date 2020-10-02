const Mongoose = require("mongoose");
const { Schema } = Mongoose;

const CartItemSchema = new Schema({
  product: {
    type: Schema.Types.ObjectId,
    ref: "books",
  },
  quantity: Number,
  totalPrice: {
    type: Number,
  },
  // priceWithTax: {
  //   type: Number,
  //   default: 0,
  // },
});

// Cart Schema
const CartSchema = new Schema({
  products: [CartItemSchema],
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  updated: { type: Date },
  created: {
    type: Date,
    default: Date.now,
  },
});

module.exports = Mongoose.model("Cart", CartSchema);
