import { useCallback, useEffect, useMemo, useState } from "react";
import CustomerDashboardLayout from "./CustomerDashboardLayout";
import { useAuth } from "../../../context/AuthContext";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";
const DEFAULT_PAGE_SIZE = 10;
const ACTIVE_BOOKING_STATUSES = ["pending", "confirmed", "in-progress"];

const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
});

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("id-ID", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

const formatCurrency = (value) => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return currencyFormatter.format(0);
  }
  return currencyFormatter.format(value);
};

const formatDate = (value) => {
  if (!value) {
    return "Unknown date";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return dateFormatter.format(date);
};

const formatTime = (value) => {
  if (!value) {
    return "Unknown time";
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }
  return timeFormatter.format(date);
};

const summarizeServices = (services) => {
  if (!Array.isArray(services) || services.length === 0) {
    return "Selected services";
  }
  const names = services
    .map((entry) => entry?.name || entry?.service?.name)
    .filter((name) => typeof name === "string" && name.trim().length > 0);
  if (names.length === 0) {
    return "Selected services";
  }
  return names.join(", ");
};

const resolveTotalAmount = (booking) => {
  if (booking?.payment && typeof booking.payment.totalAmount === "number") {
    return booking.payment.totalAmount;
  }
  if (Array.isArray(booking?.services)) {
    return booking.services.reduce((total, item) => {
      const value = typeof item?.price === "number" ? item.price : 0;
      return total + value;
    }, 0);
  }
  return 0;
};

const toTitle = (value) => {
  if (!value) {
    return "Status";
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const determineStatusKey = (booking, nowTimestamp) => {
  const status = booking?.status;
  if (!status) {
    return "pending";
  }
  if (status === "completed") {
    return "completed";
  }
  if (status === "cancelled") {
    return "cancelled";
  }
  if (ACTIVE_BOOKING_STATUSES.includes(status)) {
    const startTime = booking?.startTime ? new Date(booking.startTime) : null;
    const startTimestamp = startTime ? startTime.getTime() : NaN;
    if (!Number.isNaN(startTimestamp) && startTimestamp >= nowTimestamp) {
      return "upcoming";
    }
    return "upcoming";
  }
  return status;
};

const statusConfig = {
  upcoming: {
    label: "Upcoming",
    color: "bg-blue-100 text-blue-700",
    icon: "📅",
    borderColor: "border-blue-200",
  },
  completed: {
    label: "Completed",
    color: "bg-green-100 text-green-700",
    icon: "✓",
    borderColor: "border-green-200",
  },
  cancelled: {
    label: "Cancelled",
    color: "bg-red-100 text-red-700",
    icon: "✕",
    borderColor: "border-red-200",
  },
};

const CustomerHistory = () => {
  const { token, initializing } = useAuth();
  const [filterStatus, setFilterStatus] = useState("All");
  const [bookings, setBookings] = useState([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    upcoming: 0,
    completed: 0,
    cancelled: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: DEFAULT_PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
  });

  const normalizedFilter = filterStatus.toLowerCase();

  const filterOptions = useMemo(
    () => [
      { label: "All", value: "All", count: stats.total },
      { label: "Upcoming", value: "Upcoming", count: stats.upcoming },
      { label: "Completed", value: "Completed", count: stats.completed },
      { label: "Cancelled", value: "Cancelled", count: stats.cancelled },
    ],
    [stats]
  );

  const fetchBookings = useCallback(
    async (currentPage, currentFilter, signal) => {
      const params = new URLSearchParams();
      params.set("page", currentPage.toString());
      params.set("limit", DEFAULT_PAGE_SIZE.toString());

      if (currentFilter && currentFilter !== "all") {
        params.set("status", currentFilter);
      }

      const response = await fetch(
        `${API_BASE_URL}/api/customer/bookings?${params.toString()}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          signal,
        }
      );

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const message = payload?.message || "Failed to load booking history";
        const errorInstance = new Error(message);
        errorInstance.status = response.status;
        throw errorInstance;
      }

      return response.json();
    },
    [token]
  );

  useEffect(() => {
    setPage(1);
    setBookings([]);
  }, [normalizedFilter]);

  useEffect(() => {
    if (initializing || !token) {
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const loadBookings = async () => {
      try {
        setLoading(true);
        setError("");

        const payload = await fetchBookings(
          page,
          normalizedFilter,
          controller.signal
        );

        if (isCancelled) {
          return;
        }

        const nextBookings = Array.isArray(payload?.bookings)
          ? payload.bookings
          : [];

        setBookings((previous) =>
          page === 1 ? nextBookings : [...previous, ...nextBookings]
        );

        setStats({
          total: payload?.stats?.total ?? 0,
          upcoming: payload?.stats?.upcoming ?? 0,
          completed: payload?.stats?.completed ?? 0,
          cancelled: payload?.stats?.cancelled ?? 0,
        });

        setPagination({
          page: payload?.pagination?.page ?? page,
          limit: payload?.pagination?.limit ?? DEFAULT_PAGE_SIZE,
          total: payload?.pagination?.total ?? nextBookings.length,
          totalPages: payload?.pagination?.totalPages ?? 0,
          hasNextPage: Boolean(payload?.pagination?.hasNextPage),
          hasPreviousPage: Boolean(payload?.pagination?.hasPreviousPage),
        });
      } catch (err) {
        if (isCancelled || err.name === "AbortError") {
          return;
        }
        console.error("Failed to load booking history", err);
        setError(err.message || "Failed to load booking history");
        if (page === 1) {
          setBookings([]);
          setStats({ total: 0, upcoming: 0, completed: 0, cancelled: 0 });
          setPagination((previous) => ({
            ...previous,
            total: 0,
            totalPages: 0,
            hasNextPage: false,
            hasPreviousPage: false,
          }));
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    loadBookings();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [initializing, token, normalizedFilter, page, fetchBookings]);

  const handleFilterChange = (nextStatus) => {
    if (nextStatus === filterStatus) {
      return;
    }
    setFilterStatus(nextStatus);
  };

  const handleLoadMore = () => {
    if (pagination.hasNextPage && !loading) {
      setPage((prev) => prev + 1);
    }
  };

  const nowTimestamp = Date.now();

  const totalBookingsCount = stats.total;

  return (
    <CustomerDashboardLayout title="Booking History">
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-bold">{totalBookingsCount}</p>
              </div>
              <div className="text-4xl">📊</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Upcoming</p>
                <p className="text-3xl font-bold">{stats.upcoming}</p>
              </div>
              <div className="text-4xl">📅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold">{stats.completed}</p>
              </div>
              <div className="text-4xl">✓</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm mb-1">Cancelled</p>
                <p className="text-3xl font-bold">{stats.cancelled}</p>
              </div>
              <div className="text-4xl">✕</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-4 mb-6">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="font-semibold text-gray-700">
              Filter by Status:
            </span>
            <div className="flex gap-2 flex-wrap">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleFilterChange(option.value)}
                  className={`px-5 py-2 rounded-full font-medium transition-all duration-300 ${
                    filterStatus === option.value
                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {`${option.label} (${option.count})`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {bookings.length === 0 && loading ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-600">
              Loading booking history...
            </div>
          ) : bookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg
                className="w-20 h-20 text-gray-300 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No Bookings Found
              </h3>
              <p className="text-gray-500">
                No bookings match the selected filter.
              </p>
            </div>
          ) : (
            bookings.map((booking) => {
              const bookingId =
                booking?.id ?? booking?._id ?? booking?.startTime;
              const statusKey = determineStatusKey(booking, nowTimestamp);
              const config = statusConfig[statusKey] ?? {
                label: toTitle(statusKey),
                color: "bg-gray-100 text-gray-700",
                icon: "ℹ️",
                borderColor: "border-gray-200",
              };

              const startDateText = formatDate(booking?.startTime);
              const startTimeText = formatTime(booking?.startTime);
              const bookedOnText = formatDate(booking?.createdAt);
              const totalAmount = resolveTotalAmount(booking);
              const priceText = formatCurrency(totalAmount);
              const stylistName = booking?.stylist?.fullName || "Assigned soon";
              const serviceSummary = summarizeServices(booking?.services);

              return (
                <div
                  key={bookingId}
                  className={`bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden border-l-4 ${config.borderColor}`}
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-4">
                          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-3 flex items-center justify-center min-w-[60px]">
                            <svg
                              className="w-8 h-8 text-purple-500"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              ></path>
                            </svg>
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-800 mb-1">
                              {serviceSummary}
                            </h3>
                            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
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
                                <span>{startDateText}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
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
                                <span>{startTimeText}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                                  ></path>
                                </svg>
                                <span>{stylistName}</span>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500 mt-2">
                              Booked on: {bookedOnText}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex md:flex-col items-center md:items-end gap-3">
                        <div className="text-right">
                          <p className="text-2xl font-bold text-purple-600">
                            {priceText}
                          </p>
                        </div>
                        <span
                          className={`${config.color} px-4 py-2 rounded-full text-sm font-bold flex items-center gap-2 shadow-sm`}
                        >
                          <span className="text-lg">{config.icon}</span>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2 flex-wrap">
                      {statusKey === "upcoming" && (
                        <>
                          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg">
                            Reschedule
                          </button>
                          <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-all duration-300 shadow-md hover:shadow-lg">
                            Cancel Booking
                          </button>
                        </>
                      )}
                      {statusKey === "completed" && (
                        <>
                          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-300 shadow-md hover:shadow-lg">
                            Book Again
                          </button>
                          <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-all duration-300 shadow-md hover:shadow-lg">
                            Leave Review
                          </button>
                        </>
                      )}
                      <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-all duration-300">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {loading && page > 1 && (
            <div className="text-center text-gray-500 py-4">
              Loading more bookings...
            </div>
          )}

          {pagination.hasNextPage && (
            <div className="flex justify-center pt-2">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-5 py-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-md hover:from-purple-600 hover:to-pink-600 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </div>
      </div>
    </CustomerDashboardLayout>
  );
};

export default CustomerHistory;
