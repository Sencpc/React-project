import { useEffect, useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CustomerDashboardLayout from "./CustomerDashboardLayout";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const CustomerProfile = () => {
  const { user, token, updateUser, initializing } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingPassword, setIsEditingPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [isProfileSaving, setIsProfileSaving] = useState(false);
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  useEffect(() => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
  }, [user]);

  useEffect(() => {
    if (initializing || !token) {
      return;
    }

    const controller = new AbortController();

    const fetchProfile = async () => {
      try {
        setIsProfileLoading(true);
        setProfileError("");

        const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to load profile");
        }

        const payload = await response.json();
        if (payload?.user) {
          updateUser(payload.user);
          setFormData({
            fullName: payload.user.fullName || "",
            email: payload.user.email || "",
            phone: payload.user.phone || "",
          });
        }
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
        console.error("Failed to load customer profile", error);
        setProfileError(error.message || "Failed to load profile");
      } finally {
        setIsProfileLoading(false);
      }
    };

    fetchProfile();

    return () => controller.abort();
  }, [initializing, token, updateUser]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData((previous) => ({ ...previous, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!token) {
      setProfileError("You must be logged in to update your profile.");
      setProfileSuccess("");
      return;
    }

    const trimmedFullName = formData.fullName.trim();
    const trimmedEmail = formData.email.trim();
    const trimmedPhone = formData.phone.trim();

    if (!trimmedFullName) {
      setProfileError("Full name is required.");
      setProfileSuccess("");
      return;
    }

    if (!trimmedEmail) {
      setProfileError("Email is required.");
      setProfileSuccess("");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setProfileError("Please enter a valid email address.");
      setProfileSuccess("");
      return;
    }

    if (!trimmedPhone) {
      setProfileError("Phone number is required.");
      setProfileSuccess("");
      return;
    }

    const updateProfile = async () => {
      try {
        setIsProfileSaving(true);
        setProfileError("");
        setProfileSuccess("");

        const response = await fetch(`${API_BASE_URL}/api/customer/profile`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fullName: trimmedFullName,
            email: trimmedEmail,
            phone: trimmedPhone,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to update profile");
        }

        const payload = await response.json();
        if (payload?.user) {
          updateUser(payload.user);
          setFormData({
            fullName: payload.user.fullName || "",
            email: payload.user.email || "",
            phone: payload.user.phone || "",
          });
        }

        setProfileSuccess("Profile updated successfully!");
        setIsEditing(false);
      } catch (error) {
        console.error("Failed to update profile", error);
        setProfileError(error.message || "Failed to update profile");
      } finally {
        setIsProfileSaving(false);
      }
    };

    updateProfile();
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      setPasswordSuccess("");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters long.");
      setPasswordSuccess("");
      return;
    }

    if (!token) {
      setPasswordError("You must be logged in to update your password.");
      setPasswordSuccess("");
      return;
    }

    const updatePassword = async () => {
      try {
        setIsPasswordSaving(true);
        setPasswordError("");
        setPasswordSuccess("");

        const response = await fetch(
          `${API_BASE_URL}/api/customer/profile/password`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              currentPassword: passwordData.currentPassword,
              newPassword: passwordData.newPassword,
            }),
          }
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to update password");
        }

        setPasswordSuccess("Password updated successfully!");
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsEditingPassword(false);
      } catch (error) {
        console.error("Failed to update password", error);
        setPasswordError(error.message || "Failed to update password");
      } finally {
        setIsPasswordSaving(false);
      }
    };

    updatePassword();
  };

  const handleCancel = () => {
    setFormData({
      fullName: user?.fullName || "",
      email: user?.email || "",
      phone: user?.phone || "",
    });
    setIsEditing(false);
    setProfileError("");
    setProfileSuccess("");
  };

  return (
    <CustomerDashboardLayout title="Profile">
      <div className="p-6">
        <div className="max-w-3xl mx-auto">
          {profileSuccess && (
            <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
              {profileSuccess}
            </div>
          )}
          {profileError && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {profileError}
            </div>
          )}
          {isProfileLoading && !profileError && (
            <div className="mb-4 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
              Loading latest profile information...
            </div>
          )}

          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-semibold text-gray-900">
                My Profile
              </h3>
              {!isEditing && (
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setProfileSuccess("");
                    setProfileError("");
                  }}
                  disabled={isProfileLoading}
                  className="px-4 py-2 bg-red-400 text-white text-sm font-medium rounded-lg transition-colors hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Full Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={isProfileSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Enter your full name"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {formData.fullName || "Not set"}
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isProfileSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Enter your email"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {formData.email || "Not set"}
                    </div>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={isProfileSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Enter your phone number"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-900">
                      {formData.phone || "Not set"}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                {isEditing && (
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isProfileSaving}
                      className="flex-1 py-3 bg-red-400 text-white font-medium rounded-lg hover:bg-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isProfileSaving ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Change Password Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-gray-900">
                Change Password
              </h4>
              {!isEditingPassword && (
                <button
                  onClick={() => {
                    setIsEditingPassword(true);
                    setPasswordError("");
                    setPasswordSuccess("");
                  }}
                  className="px-4 py-2 bg-red-400 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
                >
                  Change Password
                </button>
              )}
            </div>

            {passwordSuccess && (
              <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                {passwordSuccess}
              </div>
            )}
            {passwordError && (
              <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {passwordError}
              </div>
            )}

            {isEditingPassword ? (
              <form onSubmit={handlePasswordSubmit}>
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="currentPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Current Password
                    </label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      required
                      disabled={isPasswordSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Enter current password"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="newPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                      disabled={isPasswordSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Enter new password (min. 8 characters)"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="confirmNewPassword"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      id="confirmNewPassword"
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                      minLength="8"
                      disabled={isPasswordSaving}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-400 focus:border-red-400 outline-none transition-all"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingPassword(false);
                      setPasswordData({
                        currentPassword: "",
                        newPassword: "",
                        confirmPassword: "",
                      });
                      setPasswordError("");
                      setPasswordSuccess("");
                    }}
                    className="flex-1 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordSaving}
                    className="flex-1 py-3 bg-red-400 text-white font-medium rounded-lg hover:bg-red-500 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isPasswordSaving ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </form>
            ) : (
              <p className="text-gray-600">
                Keep your account secure by regularly updating your password.
              </p>
            )}
          </div>

          {/* Additional Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">
              Account Information
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-600">Account Type</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.role || "Customer"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-600">Member Since</span>
                <span className="text-sm font-medium text-gray-900">
                  {user?.createdAt
                    ? new Date(user.createdAt).toLocaleDateString("id-ID")
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerProfile;
