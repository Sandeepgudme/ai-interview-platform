import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { getRazorpayInstance } from "../services/razorpay.service.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { planId, amount, credits } = req.body;

    console.log("========== CREATE ORDER ==========");
    console.log("Request Body:", req.body);
    console.log("User ID:", req.userId);

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated",
      });
    }

    if (!planId) {
      return res.status(400).json({
        success: false,
        message: "Plan ID missing",
      });
    }

    if (!amount || !credits) {
      return res.status(400).json({
        success: false,
        message: "Invalid plan data",
      });
    }

    if (Number(amount) <= 0 || Number(credits) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount and credits must be positive",
      });
    }

    console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);

    console.log(
      "RAZORPAY_KEY_SECRET:",
      process.env.RAZORPAY_KEY_SECRET ? "Loaded" : "Missing"
    );

    const razorpay = getRazorpayInstance();

    if (!razorpay) {
      return res.status(500).json({
        success: false,
        message: "Razorpay instance creation failed",
      });
    }

    const options = {
      amount: Number(amount) * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    console.log("Order Options:", options);

    const order = await razorpay.orders.create(options);

    console.log("Order Created:", order);

    await Payment.create({
      userId: req.userId,
      planId,
      amount,
      credits,
      razorpayOrderId: order.id,
      status: "created",
    });

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create order",
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

    if (
      !razorpay_payment_id ||
      !razorpay_order_id ||
      !razorpay_signature
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const generatedSignature = crypto
      .createHmac(
        "sha256",
        process.env.RAZORPAY_KEY_SECRET
      )
      .update(
        `${razorpay_order_id}|${razorpay_payment_id}`
      )
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    const payment = await Payment.findOne({
      razorpayOrderId: razorpay_order_id,
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    if (payment.status === "paid") {
      return res.status(400).json({
        success: false,
        message: "Payment already processed",
      });
    }

    payment.status = "paid";
    payment.razorpayPaymentId = razorpay_payment_id;

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
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to verify payment",
    });
  }
};