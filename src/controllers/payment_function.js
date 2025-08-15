const Razorpay = require('razorpay');
const crypto = require('crypto');
const User = require('../models/user');

const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const createOrder = async (req, res) => {
    try {
        // Add validation for environment variables
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay credentials not found in environment variables");
            return res.status(500).json({ 
                message: "Payment configuration error",
                error: "Missing Razorpay credentials"
            });
        }

        const options = {
            amount: 5 * 100, // Amount in the smallest currency unit (e.g., 500 INR = 50000 paise)
            currency: "INR",
            receipt: `receipt_order_${new Date().getTime()}`, // Unique receipt ID
        };

        console.log("Creating order with options:", options);
        
        const order = await instance.orders.create(options);
        
        console.log("Order created successfully:", order);

        if (!order) {
            return res.status(500).json({ 
                message: "Error creating order",
                error: "Order creation failed"
            });
        }

        res.status(200).json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
            key_id: process.env.RAZORPAY_KEY_ID // Send key_id to frontend
        });
    } catch (error) {
        console.error("Razorpay Create Order Error:", error);
        
        // More detailed error response
        res.status(500).json({ 
            message: "Could not create order",
            error: error.message || "Unknown error",
            details: error.description || "Please check your Razorpay configuration"
        });
    }
};

const verifyPayment = async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ 
                message: "Missing required payment verification data" 
            });
        }

        const userId = req.result._id; // Get user from your JWT auth middleware

        // The text to hash is order_id + "|" + razorpay_payment_id
        const body_text = `${razorpay_order_id}|${razorpay_payment_id}`;
        console.log("Verifying payment with body_text:", body_text);

        // Generate the expected signature using your key secret
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body_text)
            .digest('hex');

        console.log("Expected signature:", expectedSignature);
        console.log("Received signature:", razorpay_signature);

        // Compare signatures to verify the payment is legitimate
        if (expectedSignature === razorpay_signature) {
            // **SIGNATURE IS VALID**
            // This is where you fulfill the user's request.
            await User.findByIdAndUpdate(userId, { subscribed: true });

            res.status(200).json({ message: "Payment successful. Feature unlocked!" });
        } else {
            // **SIGNATURE IS INVALID**
            console.error("Signature mismatch");
            res.status(400).json({ message: "Invalid signature. Payment verification failed." });
        }
    } catch (error) {
        console.error("Payment Verification Error:", error);
        res.status(500).json({ 
            message: "Internal Server Error",
            error: error.message
        });
    }
};

module.exports = { createOrder, verifyPayment };