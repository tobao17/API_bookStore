const express = require("express");
const router = express.Router();
const auth = require("../middleware/verifiedToken.middleware");
const cartController = require("../controller/cart.controller");
router.get("/", auth.verified, cartController.index);

router.post("/add", auth.verified, cartController.add);

router.get("/delete/:id", auth.verified, cartController.deleteCart);

router.get("/delete/:cartId/:productId", cartController.deleteBook);

const decreaseQuantity = (products) => {
  let bulkOptions = products.map((item) => {
    return {
      updateOne: {
        filter: { _id: item.product },
        update: { $inc: { quantity: -item.quantity } },
      },
    };
  });
  console.log(bulkOptions[0].updateOne);
  Product.bulkWrite(bulkOptions);
};

module.exports = router;
