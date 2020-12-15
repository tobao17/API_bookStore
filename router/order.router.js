const express = require("express");
const router = express.Router();
const auth = require("../middleware/verifiedToken.middleware");
const orderController = require("../controller/order.controller");
router.post("/add", orderController.add); // all product =>  loai bo de test  // auth.verified
router.get("/delete/:id", orderController.deleteOrder);

router.get("/myorder", orderController.checkorder);
router.get("/", orderController.index);
module.exports = router;
