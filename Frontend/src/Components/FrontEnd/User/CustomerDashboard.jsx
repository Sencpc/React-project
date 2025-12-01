import { useEffect, useMemo, useState } from "react";
import CustomerDashboardLayout from "./CustomerDashboardLayout";
import { useAuth } from "../../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const initialStats = {
  totalBookings: 0,
  activeBookings: 0,
  completedServices: 0,
};

const ACTIVE_STATUS_BADGE = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  "in-progress": "bg-purple-100 text-purple-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const formatCurrency = (value) => {
  if (typeof value !== "number") {
    return "Rp 0";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
};

const formatDate = (value) => {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const CustomerDashboard = () => {
  const { token, initializing } = useAuth();
  const [stats, setStats] = useState(initialStats);
  const [recentBookings, setRecentBookings] = useState([]);
  const [upcomingBooking, setUpcomingBooking] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (initializing || !token) {
      return;
    }

    const controller = new AbortController();

    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(`${API_BASE_URL}/api/customer/dashboard`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to load dashboard");
        }

        const payload = await response.json();

        setStats({
          totalBookings: payload?.stats?.totalBookings ?? 0,
          activeBookings: payload?.stats?.activeBookings ?? 0,
          completedServices: payload?.stats?.completedServices ?? 0,
        });

        setRecentBookings(
          Array.isArray(payload?.recentBookings) ? payload.recentBookings : []
        );

        setUpcomingBooking(payload?.upcomingBooking ?? null);
      } catch (fetchError) {
        if (fetchError.name === "AbortError") {
          return;
        }
        console.error("Failed to load customer dashboard", fetchError);
        setError(fetchError.message || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();

    return () => controller.abort();
  }, [initializing, token]);

  const upcomingServiceName = useMemo(() => {
    if (!upcomingBooking?.services?.length) {
      return null;
    }
    const names = upcomingBooking.services
      .map((service) => service?.name)
      .filter(Boolean);
    if (names.length === 0) {
      return null;
    }
    if (names.length === 1) {
      return names[0];
    }
    const [first, second] = names;
    return `${first}${second ? ` & ${second}` : ""}`;
  }, [upcomingBooking]);

  return (
    <CustomerDashboardLayout title="Dashboard">
      <div className="p-6">
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {upcomingBooking && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 shadow-sm">
            <p className="text-sm font-medium text-blue-700">
              Upcoming Appointment
            </p>
            <div className="mt-2 flex flex-col gap-1 text-sm text-blue-800 md:flex-row md:items-center md:gap-4">
              <span className="font-semibold text-blue-900">
                {formatDate(upcomingBooking.startTime)}
              </span>
              {upcomingServiceName && <span>{upcomingServiceName}</span>}
              <span className="capitalize">
                Status: {upcomingBooking.status?.replace(/-/g, " ")}
              </span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.totalBookings}
                </p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-red-500"
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
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Active Bookings</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.activeBookings}
                </p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="h-8 w-8 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-400">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Completed Services</p>
                <p className="text-3xl font-bold text-gray-800">
                  {stats.completedServices}
                </p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
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
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-800">Recent Activity</h2>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Service
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-sm text-gray-500"
                      >
                        Loading your bookings...
                      </td>
                    </tr>
                  ) : recentBookings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-6 text-center text-sm text-gray-500"
                      >
                        No bookings found yet. Book a service to see it here.
                      </td>
                    </tr>
                  ) : (
                    recentBookings.map((booking) => {
                      const serviceNames = booking.services
                        ?.map((service) => service?.name)
                        .filter(Boolean);
                      const displayService =
                        serviceNames && serviceNames.length > 0
                          ? serviceNames.join(", ")
                          : "Service";
                      const totalAmount =
                        booking.payment?.totalAmount ??
                        booking.services?.reduce(
                          (sum, service) => sum + (service?.price ?? 0),
                          0
                        ) ??
                        0;
                      const badgeClass =
                        ACTIVE_STATUS_BADGE[booking.status] ||
                        "bg-gray-100 text-gray-700";

                      const bookingKey = (() => {
                        if (typeof booking.id === "string") return booking.id;
                        if (booking.id && typeof booking.id === "object") {
                          return (
                            booking.id.toString?.() ??
                            JSON.stringify(booking.id)
                          );
                        }
                        if (typeof booking._id === "string") return booking._id;
                        if (booking._id && typeof booking._id === "object") {
                          return (
                            booking._id.toString?.() ??
                            JSON.stringify(booking._id)
                          );
                        }
                        return `${displayService}-${
                          booking.startTime ?? "unknown"
                        }`;
                      })();

                      return (
                        <tr key={bookingKey} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {displayService}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(booking.startTime)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full capitalize ${badgeClass}`}
                            >
                              {booking.status?.replace(/-/g, " ")}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatCurrency(totalAmount)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerDashboard;
