const mongoose = require("mongoose");

var billSchema = new mongoose.Schema(
	{
		Order: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Order",
		},
		userName: String,
		products: Array,
		totalPrice: Number,
		created: {
			type: Date,
			default: Date.now,
		},
	},
	{ timestamps: true }
);
const bill = mongoose.model("bill", billSchema);
module.exports = bill;
