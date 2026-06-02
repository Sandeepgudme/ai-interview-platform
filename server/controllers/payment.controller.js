import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { getRazorpayInstance } from "../services/razorpay.service.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { planId, amount, credits } = req.body;

    if (!planId) {
      return res.status(400).json({
        message: "Plan ID missing",
      });
    }

    if (amount == null || credits == null) {
      return res.status(400).json({
        message: "Invalid plan data",
      });
    }

    if (Number(amount) <= 0 || Number(credits) <= 0) {
      return res.status(400).json({
        message: "Amount and credits must be positive",
      });
    }

    console.log("RAZORPAY_KEY_ID =", process.env.RAZORPAY_KEY_ID);
    console.log(
      "RAZORPAY_KEY_SECRET =",
      process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Missing"
    );

    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(500).json({
        message: "Razorpay not configured",
      });
    }

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Creating Razorpay Order...");
    console.log(options);

    const order = await razorpay.orders.create(options);

    await Payment.create({
      userId: req.userId,
      planId,
      amount,
      credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(200).json(order);
  } catch (err) {
    console.error("CREATE ORDER ERROR:", err);

    return res.status(500).json({
      message: err.message || "Failed to create order",
    });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    const body =
      razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({
        message: "Invalid payment signature",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(400).json({
        message: "Already processed",
      });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;

    if (!payment.userId) {
      payment.userId = req.userId;
    }

    await payment.save();

    const updatedUser = await User.findByIdAndUpdate(
      payment.userId,
      {
        $inc: {
          credits: payment.credits,
        },
      },
      {
        new: true,
      }
    );

    if (!updatedUser) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified and credits added",
      user: updatedUser,
    });
  } catch (err) {
    console.error("VERIFY PAYMENT ERROR:", err);

    return res.status(500).json({
      message: err.message || "Failed to verify payment",
    });
  }
};