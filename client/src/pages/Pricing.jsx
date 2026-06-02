import React, { useState } from "react";
import { FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import axios from "axios";
import { useDispatch } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { ServerUrl } from "../App";

function Pricing() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [selectedPlan, setSelectedPlan] = useState("free");
  const [loadingPlan, setLoadingPlan] = useState(null);

  const plans = [
    {
      id: "free",
      name: "Free",
      price: "₹0",
      credits: 100,
      description: "Perfect for beginners starting interview preparation",
      features: [
        "100 AI Interview Credits",
        "Basic Performance Report",
        "Voice Interview Access",
        "Limited History Tracking",
      ],
      default: true,
    },
    {
      id: "basic",
      name: "Starter Pack",
      price: "₹100",
      credits: 150,
      description: "Great for focused practice and skill improvement",
      features: [
        "150 AI Interview Credits",
        "Detailed Feedback",
        "Performance Analysis",
        "Full Interview History",
      ],
    },
    {
      id: "pro",
      name: "Pro Pack",
      price: "₹500",
      credits: 650,
      description: "Best practice for serious job preparation",
      features: [
        "650 AI Interview Credits",
        "Advanced AI Feedback",
        "Skill Trend Analysis",
        "Priority AI Processing",
      ],
      badge: "Best Value",
    },
  ];

  const handlePayment = async (plan) => {
    setLoadingPlan(plan.id);

    try {
      const amount =
        plan.id === "basic"
          ? 100
          : plan.id === "pro"
          ? 500
          : 0;

      const result = await axios.post(
        ServerUrl + "/api/payment/order",
        {
          planId: plan.id,
          amount,
          credits: plan.credits,
        },
        { withCredentials: true }
      );

      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      console.log("Razorpay Key:", razorpayKey);
      console.log("Order Response:", result.data);

      if (!razorpayKey) {
        alert(
          "Razorpay Key Missing. Check VITE_RAZORPAY_KEY_ID in client/.env"
        );
        return;
      }

      if (!window.Razorpay) {
        alert("Razorpay SDK not loaded.");
        return;
      }

      const options = {
        key: razorpayKey,
        amount: result.data.amount,
        currency: result.data.currency || "INR",
        name: "getAIInterview",
        description: `${plan.name} - ${plan.credits} Credits`,
        order_id: result.data.id,

        handler: async function (response) {
          try {
            const verifyPay = await axios.post(
              ServerUrl + "/api/payment/verify",
              response,
              { withCredentials: true }
            );

            if (verifyPay.data?.success) {
              dispatch(setUserData(verifyPay.data.user));

              const freshUser = await axios.get(
                ServerUrl + "/api/user/current-user",
                { withCredentials: true }
              );

              dispatch(setUserData(freshUser.data));

              alert(
                `Payment successful. ${plan.credits} credits added!`
              );

              navigate("/");
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error(err);
            alert("Payment verification failed.");
          }
        },

        theme: {
          color: "#6366f1",
        },
      };

      const rzp = new window.Razorpay(options);

      rzp.on("payment.failed", function (response) {
        console.log(response.error);
        alert("Payment failed.");
      });

      rzp.open();
    } catch (error) {
      console.error(error);

      if (error.response) {
        console.log(error.response.data);
      }

      alert("Unable to start payment. Please try again.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b1120] py-16 px-6">
      <div className="max-w-6xl mx-auto mb-14 flex items-start gap-4">
        <button
          onClick={() => navigate("/")}
          className="mt-2 p-3 rounded-full bg-white/10 hover:bg-white/20 border border-white/10"
        >
          <FaArrowLeft className="text-[#94a3b8]" />
        </button>

        <div className="text-center w-full">
          <h1 className="text-4xl font-bold text-[#e2e8f0]">
            Choose Your Plan
          </h1>
          <p className="text-[#94a3b8] mt-3">
            Flexible pricing to match your interview preparation goals.
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <motion.div
            key={plan.id}
            whileHover={{ scale: 1.03 }}
            className="rounded-3xl p-8 border border-white/10 bg-white/5"
          >
            <h2 className="text-xl font-semibold text-white">
              {plan.name}
            </h2>

            <div className="mt-4">
              <span className="text-3xl font-bold text-[#38bdf8]">
                {plan.price}
              </span>
              <p className="text-[#94a3b8]">
                {plan.credits} Credits
              </p>
            </div>

            <p className="text-[#94a3b8] mt-4">
              {plan.description}
            </p>

            <div className="mt-6 space-y-3">
              {plan.features.map((feature, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <FaCheckCircle className="text-[#6366f1]" />
                  <span className="text-white text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {!plan.default && (
              <button
                onClick={() => handlePayment(plan)}
                disabled={loadingPlan === plan.id}
                className="w-full mt-8 py-3 rounded-xl bg-[#6366f1] text-white"
              >
                {loadingPlan === plan.id
                  ? "Processing..."
                  : "Proceed to Pay"}
              </button>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default Pricing;