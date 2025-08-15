let express=require("express");
let payment_router=express.Router();
let usermiddleware=require("../middleware/usermiddle")
let {createOrder,verifyPayment} =require("../controllers/payment_function")



payment_router.post('/create-order',usermiddleware, createOrder);
payment_router.post('/verify-payment',usermiddleware, verifyPayment);

module.exports=payment_router