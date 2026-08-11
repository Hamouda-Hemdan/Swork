import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  completeMockProjectPayment,
  getMockProjectPaymentStatus,
} from "../api/auth";

const paymentMethods = [
  {
    id: "card",
    label: "Credit or Debit Card",
    description: "Visa, MasterCard, American Express",
  },
  {
    id: "apple",
    label: "Apple Pay",
    description: "Fast checkout with Apple Pay",
  },
  {
    id: "google",
    label: "Google Pay",
    description: "Pay quickly with Google Pay",
  },
  {
    id: "wallet",
    label: "Wallet",
    description: "Use your platform wallet balance",
  },
];

const MockPaymentCheckout = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState(null);
  const [selectedMethod, setSelectedMethod] = useState("card");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getMockProjectPaymentStatus(projectId);
        setStatus(data);
      } catch (err) {
        console.error("Failed to load payment status:", err);
        setError(
          err.response?.data?.message || "Failed to load payment details.",
        );
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [projectId]);

  const handlePayNow = async () => {
    try {
      setSubmitting(true);
      setError("");
      setSuccess("");
      await completeMockProjectPayment(projectId);
      setSuccess("Payment completed successfully.");
      const refreshed = await getMockProjectPaymentStatus(projectId);
      setStatus(refreshed);
    } catch (err) {
      console.error("Failed to complete payment:", err);
      setError(err.response?.data?.message || "Failed to complete payment.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-gray-700">
          Loading checkout...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f9fc] py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="mb-6">
            <p className="text-xs uppercase tracking-wide text-indigo-600 font-semibold">
              SWork Payment Checkout
            </p>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">
              Complete your payment
            </h1>
            <p className="text-sm text-gray-600 mt-2">Project #{projectId}</p>
          </div>

          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 rounded-xl border border-green-200 bg-green-50 text-green-700 px-4 py-3 text-sm">
              {success}
            </div>
          )}

          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <label
                key={method.id}
                className={`block rounded-xl border p-4 cursor-pointer transition ${
                  selectedMethod === method.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="radio"
                    name="payment-method"
                    value={method.id}
                    checked={selectedMethod === method.id}
                    onChange={(e) => setSelectedMethod(e.target.value)}
                    className="mt-1"
                  />
                  <div>
                    <p className="font-semibold text-gray-900">
                      {method.label}
                    </p>
                    <p className="text-sm text-gray-600">
                      {method.description}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={handlePayNow}
              disabled={submitting || status?.isFunded}
              className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 font-semibold disabled:bg-gray-300"
            >
              {status?.isFunded
                ? "Already Paid"
                : submitting
                  ? "Processing..."
                  : "Pay Now"}
            </button>
            <button
              onClick={() => navigate("/projects")}
              className="rounded-xl border border-gray-300 bg-white text-gray-700 px-6 py-3 font-semibold hover:bg-gray-50"
            >
              Back to Projects
            </button>
          </div>
        </section>

        <aside className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit">
          <h2 className="text-lg font-bold text-gray-900">Order summary</h2>
          <div className="mt-4 space-y-3 text-sm text-gray-700">
            <div className="flex justify-between">
              <span>Project amount</span>
              <span className="font-semibold">
                ${Number(status?.amount || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Platform fee</span>
              <span>$0.00</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between text-base font-bold text-gray-900">
              <span>Total</span>
              <span>${Number(status?.amount || 0).toFixed(2)}</span>
            </div>
            <div className="pt-3">
              <p className="text-xs uppercase tracking-wide text-gray-500">
                Payment status
              </p>
              <p
                className={`font-semibold ${status?.isFunded ? "text-green-700" : "text-yellow-700"}`}
              >
                {status?.isFunded ? "Funded" : "Pending"}
              </p>
              {status?.fundedAt && (
                <p className="text-xs text-gray-500 mt-1">
                  Funded at {new Date(status.fundedAt).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default MockPaymentCheckout;
