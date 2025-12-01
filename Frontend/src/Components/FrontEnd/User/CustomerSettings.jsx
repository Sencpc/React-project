import { useCallback, useEffect, useState } from "react";
import CustomerDashboardLayout from "./CustomerDashboardLayout";
import { useAuth } from "../../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const DEFAULT_NOTIFICATIONS = {
  email: true,
  sms: false,
  push: true,
  bookingReminders: true,
  promotions: false,
  newsletter: true,
};

const NOTIFICATION_KEYS = Object.keys(DEFAULT_NOTIFICATIONS);

const CustomerSettings = () => {
  const { token, updateUser, logout } = useAuth();

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(() => ({
    ...DEFAULT_NOTIFICATIONS,
  }));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [error, setError] = useState("");
  const [hasChanges, setHasChanges] = useState(false);
  const [serverSettings, setServerSettings] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  const applySettings = useCallback((settings, { store = false } = {}) => {
    if (!settings) {
      return;
    }

    const isDark =
      typeof settings.darkMode === "boolean"
        ? settings.darkMode
        : (settings.theme || "light").toLowerCase() === "dark";

    setDarkMode(isDark);

    setNotifications(() => {
      const next = { ...DEFAULT_NOTIFICATIONS };
      if (
        settings.notificationPrefs &&
        typeof settings.notificationPrefs === "object"
      ) {
        NOTIFICATION_KEYS.forEach((key) => {
          if (settings.notificationPrefs[key] !== undefined) {
            next[key] = Boolean(settings.notificationPrefs[key]);
          }
        });
      }
      return next;
    });

    if (store) {
      setServerSettings(settings);
    }
  }, []);

  const fetchSettings = useCallback(
    async (signal) => {
      if (!token) {
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/customer/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        ...(signal ? { signal } : {}),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to load settings");
      }

      const payload = await response.json();
      applySettings(payload?.settings, { store: true });
      setError("");
    },
    [applySettings, token]
  );

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);

    fetchSettings(controller.signal)
      .catch((err) => {
        console.error("Failed to load settings", err);
        setError(err.message || "Failed to load settings");
      })
      .finally(() => {
        setLoading(false);
      });

    return () => controller.abort();
  }, [token, fetchSettings]);

  useEffect(() => {
    if (!saveMessage) {
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setSaveMessage("");
    }, 4000);

    return () => window.clearTimeout(timeout);
  }, [saveMessage]);

  const toggleDarkMode = () => {
    if (loading || saving) {
      return;
    }
    setError("");
    setSaveMessage("");
    setDarkMode((previous) => {
      return !previous;
    });
  };

  const handleNotificationChange = (key) => {
    if (loading || saving) {
      return;
    }
    setError("");
    setSaveMessage("");
    setNotifications((previous) => {
      return { ...previous, [key]: !previous[key] };
    });
  };

  const handleSaveSettings = async () => {
    if (!hasChanges || saving) {
      return;
    }

    if (!token) {
      setError("You must be signed in to update settings.");
      return;
    }

    try {
      setSaving(true);
      setSaveMessage("");
      setError("");

      const response = await fetch(`${API_BASE_URL}/api/customer/settings`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          darkMode,
          notificationPrefs: notifications,
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to update settings");
      }

      const payload = await response.json();
      applySettings(payload?.settings, { store: true });

      if (payload?.user) {
        updateUser(payload.user);
      }

      setSaveMessage("Settings updated successfully.");
    } catch (err) {
      console.error("Failed to update settings", err);
      setError(err.message || "Failed to update settings");
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = () => {
    if (saving || loading) {
      return;
    }
    if (serverSettings) {
      applySettings(serverSettings, { store: false });
      setError("");
      setSaveMessage("");
    } else if (token) {
      setLoading(true);
      fetchSettings()
        .catch((err) => {
          console.error("Failed to reload settings", err);
          setError(err.message || "Failed to load settings");
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  useEffect(() => {
    if (!serverSettings) {
      const defaultDiff =
        darkMode !== false ||
        NOTIFICATION_KEYS.some(
          (key) => DEFAULT_NOTIFICATIONS[key] !== Boolean(notifications[key])
        );
      setHasChanges(defaultDiff);
      return;
    }

    const serverDarkMode =
      typeof serverSettings.darkMode === "boolean"
        ? serverSettings.darkMode
        : (serverSettings.theme || "light").toLowerCase() === "dark";

    const serverPrefs = { ...DEFAULT_NOTIFICATIONS };
    if (
      serverSettings.notificationPrefs &&
      typeof serverSettings.notificationPrefs === "object"
    ) {
      NOTIFICATION_KEYS.forEach((key) => {
        if (serverSettings.notificationPrefs[key] !== undefined) {
          serverPrefs[key] = Boolean(serverSettings.notificationPrefs[key]);
        }
      });
    }

    const hasDiff =
      serverDarkMode !== darkMode ||
      NOTIFICATION_KEYS.some(
        (key) => serverPrefs[key] !== Boolean(notifications[key])
      );

    setHasChanges(hasDiff);
  }, [darkMode, notifications, serverSettings]);

  const handleDeleteAccount = async () => {
    if (confirmText !== "DELETE") {
      window.alert("Please type DELETE to confirm");
      return;
    }

    if (!token) {
      window.alert("You must be signed in to deactivate your account.");
      return;
    }

    try {
      setDeleteLoading(true);

      const response = await fetch(
        `${API_BASE_URL}/api/customer/settings/deactivate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: deleteReason }),
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || "Failed to deactivate account");
      }

      const payload = await response.json();

      if (payload?.user) {
        updateUser(payload.user);
      }

      window.alert(
        payload?.message ||
          "Your account has been deactivated. You can reactivate it within 30 days by logging in again."
      );

      setShowDeleteModal(false);
      setDeleteReason("");
      setConfirmText("");
      setDeleteLoading(false);

      logout();
    } catch (err) {
      console.error("Failed to deactivate account", err);
      window.alert(err.message || "Failed to deactivate account");
      setDeleteLoading(false);
    }
  };

  const disableInteractions = loading || saving;

  return (
    <CustomerDashboardLayout title="Settings">
      <div className="p-6 space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
          {saveMessage && !error && (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {saveMessage}
            </div>
          )}
          {!error && loading && (
            <div className="text-sm text-gray-500">Loading settings...</div>
          )}
          <div className="flex gap-3 md:ml-auto">
            <button
              type="button"
              onClick={handleResetSettings}
              disabled={disableInteractions || (!hasChanges && !serverSettings)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-100 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={!hasChanges || disableInteractions}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                ></path>
              </svg>
              Appearance
            </h2>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  Dark Mode
                </h3>
                <p className="text-sm text-gray-600">
                  Switch between light and dark theme
                </p>
              </div>
              <button
                type="button"
                onClick={toggleDarkMode}
                disabled={disableInteractions}
                className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-4 focus:ring-purple-300 ${
                  darkMode
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
                    darkMode ? "translate-x-9" : "translate-x-1"
                  }`}
                >
                  {darkMode ? (
                    <svg
                      className="w-6 h-6 text-purple-500 p-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path>
                    </svg>
                  ) : (
                    <svg
                      className="w-6 h-6 text-yellow-500 p-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      ></path>
                    </svg>
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                ></path>
              </svg>
              Notification Preferences
            </h2>
          </div>
          <div className="p-6 space-y-4">
            {/* Email Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Email Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Receive updates via email
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("email")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.email
                    ? "bg-gradient-to-r from-blue-500 to-cyan-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.email ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* SMS Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    SMS Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Get text messages for updates
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("sms")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.sms
                    ? "bg-gradient-to-r from-green-500 to-emerald-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.sms ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Push Notifications */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-purple-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Push Notifications
                  </h3>
                  <p className="text-sm text-gray-600">
                    Browser push notifications
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("push")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.push
                    ? "bg-gradient-to-r from-purple-500 to-pink-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.push ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Booking Reminders */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-yellow-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Booking Reminders
                  </h3>
                  <p className="text-sm text-gray-600">
                    Reminders for upcoming appointments
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("bookingReminders")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.bookingReminders
                    ? "bg-gradient-to-r from-yellow-500 to-orange-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.bookingReminders
                      ? "translate-x-8"
                      : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Promotions */}
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="bg-pink-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-pink-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">
                    Promotions & Offers
                  </h3>
                  <p className="text-sm text-gray-600">
                    Special deals and discounts
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("promotions")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.promotions
                    ? "bg-gradient-to-r from-pink-500 to-rose-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.promotions ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Newsletter */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <svg
                    className="w-5 h-5 text-indigo-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                    ></path>
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-800">Newsletter</h3>
                  <p className="text-sm text-gray-600">
                    Beauty tips and trends newsletter
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleNotificationChange("newsletter")}
                disabled={disableInteractions}
                className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors duration-300 ${
                  notifications.newsletter
                    ? "bg-gradient-to-r from-indigo-500 to-purple-500"
                    : "bg-gray-300"
                } disabled:cursor-not-allowed disabled:opacity-60`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform duration-300 ${
                    notifications.newsletter ? "translate-x-8" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone - Delete Account */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden border-2 border-red-200">
          <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                ></path>
              </svg>
              Danger Zone
            </h2>
          </div>
          <div className="p-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-bold text-red-800 mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-red-700 mb-4">
                Once you delete your account, all your data will be deactivated.
                You can reactivate your account within 30 days by logging in
                again. After 30 days, your data will be permanently deleted.
              </p>
              <ul className="text-sm text-red-700 space-y-1 mb-4">
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  Your booking history will be archived
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  You can reactivate within 30 days
                </li>
                <li className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    ></path>
                  </svg>
                  After 30 days, deletion is permanent
                </li>
              </ul>
            </div>
            <button
              type="button"
              onClick={() => setShowDeleteModal(true)}
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                ></path>
              </svg>
              Delete My Account
            </button>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-fadeIn">
            <div className="bg-gradient-to-r from-red-500 to-rose-500 px-6 py-4">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  ></path>
                </svg>
                Confirm Account Deletion
              </h3>
            </div>
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                We're sorry to see you go! Before you delete your account,
                please tell us why:
              </p>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Your feedback helps us improve (optional)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 mb-4 resize-none"
                rows="3"
              ></textarea>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-700 mb-2">
                  To confirm deletion, type <strong>DELETE</strong> in the box
                  below:
                </p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  className="w-full px-4 py-2 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteReason("");
                    setConfirmText("");
                    setDeleteLoading(false);
                  }}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-4 rounded-lg transition-all duration-300"
                  disabled={deleteLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={confirmText !== "DELETE" || deleteLoading}
                >
                  {deleteLoading ? "Deleting..." : "Delete Account"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </CustomerDashboardLayout>
  );
};

export default CustomerSettings;
