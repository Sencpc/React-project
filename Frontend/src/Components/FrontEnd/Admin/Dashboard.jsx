import AdminLayout from "./AdminLayout";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const Dashboard = () => {
  // Data untuk grafik revenue per bulan
  const monthlyRevenueData = [
    { month: "Jan", revenue: 12500000, discount: 1250000, net: 11250000 },
    { month: "Feb", revenue: 14200000, discount: 1420000, net: 12780000 },
    { month: "Mar", revenue: 13800000, discount: 1380000, net: 12420000 },
    { month: "Apr", revenue: 15600000, discount: 1560000, net: 14040000 },
    { month: "May", revenue: 17300000, discount: 1730000, net: 15570000 },
    { month: "Jun", revenue: 16900000, discount: 1690000, net: 15210000 },
    { month: "Jul", revenue: 18500000, discount: 1850000, net: 16650000 },
    { month: "Aug", revenue: 19200000, discount: 1920000, net: 17280000 },
    { month: "Sep", revenue: 20100000, discount: 2010000, net: 18090000 },
    { month: "Oct", revenue: 22400000, discount: 2240000, net: 20160000 },
  ];

  // Data untuk grafik revenue per minggu (bulan Oktober)
  const weeklyRevenueData = [
    { week: "Week 1", revenue: 5200000, discount: 520000, net: 4680000 },
    { week: "Week 2", revenue: 5800000, discount: 580000, net: 5220000 },
    { week: "Week 3", revenue: 6100000, discount: 610000, net: 5490000 },
    { week: "Week 4", revenue: 5300000, discount: 530000, net: 4770000 },
  ];

  // Data untuk service popularity
  const serviceData = [
    { name: "Haircut", value: 35, color: "#EF4444" },
    { name: "Coloring", value: 25, color: "#F59E0B" },
    { name: "Treatment", value: 20, color: "#10B981" },
    { name: "Spa", value: 15, color: "#3B82F6" },
    { name: "Others", value: 5, color: "#8B5CF6" },
  ];

  return (
    <AdminLayout title="Dashboard">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-blue-500 overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-500/35 bg-opacity-30 rounded-md p-3">
                  <svg
                    className="w-[48px] h-[48px] text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm-2 9a4 4 0 0 0-4 4v1a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-1a4 4 0 0 0-4-4h-4Z"
                      clip-rule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-90 truncate">
                      Active Users
                    </dt>
                    <dd className="text-3xl font-bold text-white">1,247</dd>
                    <dd className="text-xs text-white text-opacity-80 mt-1">
                      ↑ 12% from last month
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-green-500 overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-500/35 bg-opacity-30 rounded-md p-3">
                  <svg
                    className="w-[48px] h-[48px] text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.045 3.007 12.31 3a1.965 1.965 0 0 0-1.4.585l-7.33 7.394a2 2 0 0 0 0 2.805l6.573 6.631a1.957 1.957 0 0 0 1.4.585 1.965 1.965 0 0 0 1.4-.585l7.409-7.477A2 2 0 0 0 21 11.479v-5.5a2.972 2.972 0 0 0-2.955-2.972Zm-2.452 6.438a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-90 truncate">
                      Active Coupons
                    </dt>
                    <dd className="text-3xl font-bold text-white">52</dd>
                    <dd className="text-xs text-white text-opacity-80 mt-1">
                      12 expiring soon
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-purple-500 overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-500/35 bg-opacity-30 rounded-md p-3">
                  <svg
                    className="w-[48px] h-[48px] text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M13.6 16.733c.234.269.548.456.895.534a1.4 1.4 0 0 0 1.75-.762c.172-.615-.446-1.287-1.242-1.481-.796-.194-1.41-.861-1.241-1.481a1.4 1.4 0 0 1 1.75-.762c.343.077.654.26.888.524m-1.358 4.017v.617m0-5.939v.725M4 15v4m3-6v6M6 8.5 10.5 5 14 7.5 18 4m0 0h-3.5M18 4v3m2 8a5 5 0 1 1-10 0 5 5 0 0 1 10 0Z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-90 truncate">
                      Revenue (Monthly)
                    </dt>
                    <dd className="text-3xl font-bold text-white">Rp 20.1M</dd>
                    <dd className="text-xs text-white text-opacity-80 mt-1">
                      ↑ 8.5% from last month
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-orange-500 overflow-hidden shadow-lg rounded-lg hover:shadow-xl transition-shadow duration-200">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gray-500/35 bg-opacity-30 rounded-md p-3">
                  <svg
                    className="w-[48px] h-[48px] text-gray-800 dark:text-white"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                      d="M4 10h16M8 14h8m-4-7V4M7 7V4m10 3V4M5 20h14a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1Z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white text-opacity-90 truncate">
                      Revenue (Weekly)
                    </dt>
                    <dd className="text-3xl font-bold text-white">Rp 5.3M</dd>
                    <dd className="text-xs text-white text-opacity-80 mt-1">
                      Current week (Week 4)
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Monthly Revenue Trend
              </h3>
              <p className="text-sm text-gray-500">
                Revenue vs Discount vs Net Revenue (2024)
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  formatter={(value) => `Rp ${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8B5CF6"
                  strokeWidth={2}
                  name="Gross Revenue"
                />
                <Line
                  type="monotone"
                  dataKey="discount"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Coupon Discount"
                />
                <Line
                  type="monotone"
                  dataKey="net"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Net Revenue"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Weekly Revenue Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Weekly Revenue Breakdown
              </h3>
              <p className="text-sm text-gray-500">
                October 2024 - Weekly Performance
              </p>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={weeklyRevenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" />
                <YAxis tickFormatter={(value) => `${value / 1000000}M`} />
                <Tooltip
                  formatter={(value) => `Rp ${(value / 1000000).toFixed(2)}M`}
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #ccc",
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#3B82F6" name="Gross Revenue" />
                <Bar dataKey="discount" fill="#F59E0B" name="Coupon Discount" />
                <Bar dataKey="net" fill="#10B981" name="Net Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bottom Row - Service Popularity & Revenue Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Service Popularity Pie Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Service Popularity
              </h3>
              <p className="text-sm text-gray-500">
                Distribution by service type
              </p>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) =>
                    `${name} ${(percent * 100).toFixed(0)}%`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Summary */}
          <div className="bg-white rounded-lg shadow-sm p-6 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                Revenue Summary
              </h3>
              <p className="text-sm text-gray-500">
                Detailed breakdown of current month
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">
                    Gross Revenue (October)
                  </p>
                  <p className="text-2xl font-bold text-purple-600">
                    Rp 22,400,000
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Bookings</p>
                  <p className="text-xl font-semibold text-gray-900">247</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Coupon Discounts</p>
                  <p className="text-2xl font-bold text-red-600">
                    - Rp 2,240,000
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Discount Rate</p>
                  <p className="text-xl font-semibold text-gray-900">10%</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border-2 border-green-200">
                <div>
                  <p className="text-sm text-gray-600">Net Revenue</p>
                  <p className="text-2xl font-bold text-green-600">
                    Rp 20,160,000
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Avg per Booking</p>
                  <p className="text-xl font-semibold text-gray-900">
                    Rp 81,619
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-600">Most Popular Service</p>
                  <p className="text-lg font-bold text-blue-600">
                    Haircut (35%)
                  </p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-lg">
                  <p className="text-xs text-gray-600">Peak Day</p>
                  <p className="text-lg font-bold text-yellow-600">Saturday</p>
                </div>
                <div className="p-3 bg-pink-50 rounded-lg">
                  <p className="text-xs text-gray-600">Active Admin</p>
                  <p className="text-lg font-bold text-pink-600">18 Members</p>
                </div>
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <p className="text-xs text-gray-600">Customer Retention</p>
                  <p className="text-lg font-bold text-indigo-600">78%</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">
                  Pending Bookings
                </p>
                <p className="text-2xl font-bold text-gray-900">38</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <svg
                  className="h-6 w-6 text-blue-600"
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

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">
                  Completed Today
                </p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <svg
                  className="h-6 w-6 text-green-600"
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

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">New Customers</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="bg-yellow-100 rounded-full p-3">
                <svg
                  className="h-6 w-6 text-yellow-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase">Cancelled</p>
                <p className="text-2xl font-bold text-gray-900">7</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default Dashboard;
