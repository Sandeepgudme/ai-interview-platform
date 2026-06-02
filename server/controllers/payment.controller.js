import Payment from "../models/payment.model.js";
import User from "../models/user.model.js";
import { getRazorpayInstance } from "../services/razorpay.service.js";
import crypto from "crypto";

export const createOrder = async (req, res) => {
  try {
    const { planId, amount, credits } = req.body;

    console.log("REQUEST BODY:", req.body);
    console.log("USER ID:", req.userId);

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

    console.log("========== RAZORPAY DEBUG ==========");
    console.log("RAZORPAY_KEY_ID:", process.env.RAZORPAY_KEY_ID);

    console.log(
      "RAZORPAY_KEY_SECRET:",
      process.env.RAZORPAY_KEY_SECRET
        ? "Loaded"
        : "Missing"
    );

    const razorpay = getRazorpayInstance();

    console.log("RAZORPAY INSTANCE:", !!razorpay);

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

    console.log("ORDER OPTIONS:", options);

    const order = await razorpay.orders.create(options);

    console.log("ORDER CREATED SUCCESSFULLY");
    console.log(order);

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
    console.error("========= CREATE ORDER ERROR =========");
    console.error("MESSAGE:", err.message);
    console.error("ERROR:", err);

    if (err.error) {
      console.error("RAZORPAY ERROR:", err.error);
    }

    return res.status(500).json({
      success: false,
      message: err.message || "Failed to create order",
    });
  }
};