import { useEffect, useRef, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const STEPS = {
  request: "request",
  verify: "verify",
  reset: "reset",
  success: "success",
};

const initialState = {
  email: "",
  code: "",
  password: "",
  confirmPassword: "",
};

const ForgotPasswordModal = ({ onClose }) => {
  const modalRef = useRef(null);
  const [formState, setFormState] = useState(initialState);
  const [step, setStep] = useState(STEPS.request);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [resetToken, setResetToken] = useState(null);
  const [expiresAt, setExpiresAt] = useState(null);

  const closeAndReset = () => {
    setFormState(initialState);
    setStep(STEPS.request);
    setSubmitting(false);
    setError("");
    setInfo("");
    setResetToken(null);
    setExpiresAt(null);
    onClose?.();
  };

  useEffect(() => {
    const handler = (event) => {
      if (event.key === "Escape") {
        closeAndReset();
      }
    };

    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        closeAndReset();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormState((prev) => ({ ...prev, [name]: value }));
    if (error) {
      setError("");
    }
    if (info) {
      setInfo("");
    }
  };

  const requestCode = async (event) => {
    event.preventDefault();
    setError("");

    if (!formState.email) {
      setError("Email is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password/forgot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to send verification code");
      }

      setInfo(data?.message || "Verification code sent via SMS");
      setStep(STEPS.verify);
    } catch (err) {
      setError(err.message || "Failed to send verification code");
    } finally {
      setSubmitting(false);
    }
  };

  const verifyCode = async (event) => {
    event.preventDefault();
    setError("");

    if (!formState.code) {
      setError("Verification code is required");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: formState.email, code: formState.code }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(
          data?.message || "Invalid or expired verification code"
        );
      }

      setResetToken(data.resetToken);
      setExpiresAt(data.expiresAt);
      setInfo("Phone number verified. You can now set a new password.");
      setStep(STEPS.reset);
    } catch (err) {
      setError(err.message || "Failed to verify the provided code");
    } finally {
      setSubmitting(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");

    if (!formState.password || !formState.confirmPassword) {
      setError("Please enter and confirm your new password");
      return;
    }

    if (formState.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formState.password !== formState.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (!resetToken) {
      setError("Verification is required before resetting password");
      setStep(STEPS.verify);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/password/reset`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formState.email,
          token: resetToken,
          password: formState.password,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to reset password");
      }

      setStep(STEPS.success);
      setInfo(data?.message || "Password updated successfully");
      setTimeout(closeAndReset, 2000);
    } catch (err) {
      setError(err.message || "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  };

  const renderContent = () => {
    switch (step) {
      case STEPS.request:
        return (
          <form className="space-y-5" onSubmit={requestCode}>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Registered Email
              </label>
              <input
                type="email"
                name="email"
                value={formState.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-400 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition disabled:opacity-70"
            >
              {submitting ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        );
      case STEPS.verify:
        return (
          <form className="space-y-5" onSubmit={verifyCode}>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to the phone number linked with{" "}
              {formState.email}.
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Verification Code
              </label>
              <input
                type="text"
                name="code"
                value={formState.code}
                onChange={handleChange}
                placeholder="123456"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-400 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition disabled:opacity-70"
            >
              {submitting ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        );
      case STEPS.reset:
        return (
          <form className="space-y-5" onSubmit={resetPassword}>
            {expiresAt && (
              <p className="text-xs text-gray-500">
                Token expires at {new Date(expiresAt).toLocaleTimeString()}
              </p>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <input
                type="password"
                name="password"
                value={formState.password}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={formState.confirmPassword}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-300 focus:border-transparent"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-400 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition disabled:opacity-70"
            >
              {submitting ? "Updating..." : "Update Password"}
            </button>
          </form>
        );
      case STEPS.success:
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg
                className="h-8 w-8 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-700 font-medium">
              Password updated successfully. You can sign in with the new
              password.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center px-4 z-50">
      <div
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-semibold text-gray-800">
              Reset password
            </h3>
            <p className="text-sm text-gray-500">
              {step === STEPS.request && "We will text a verification code."}
              {step === STEPS.verify && "Enter the code to verify your phone."}
              {step === STEPS.reset && "Create a new password."}
            </p>
          </div>
          <button
            type="button"
            onClick={closeAndReset}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-200 rounded-lg">
            {error}
          </div>
        )}

        {info && (
          <div className="p-3 mb-4 text-sm text-green-700 bg-green-100 border border-green-200 rounded-lg">
            {info}
          </div>
        )}

        {renderContent()}

        {step !== STEPS.success && (
          <p className="mt-6 text-xs text-gray-500 text-center">
            Need help? Contact our support team.
          </p>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
