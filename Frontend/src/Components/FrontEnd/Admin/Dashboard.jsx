import AdminLayout from "./AdminLayout";
import { Card, Col, Row, Statistic, Typography } from "antd";
import {
  DollarOutlined,
  PercentageOutlined,
  TeamOutlined,
  TagOutlined,
} from "@ant-design/icons";
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
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Users"
                value={1247}
                prefix={<TeamOutlined />}
                suffix={<Typography.Text type="secondary">(+12%)</Typography.Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Active Coupons"
                value={52}
                prefix={<TagOutlined />}
                suffix={<Typography.Text type="secondary">(12 expiring)</Typography.Text>}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Revenue (Monthly)"
                value={20.1}
                precision={1}
                prefix={<DollarOutlined />}
                suffix="M"
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Discount (Monthly)"
                value={2.24}
                precision={2}
                prefix={<PercentageOutlined />}
                suffix="M"
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              title="Monthly Revenue Trend"
              extra={
                <Typography.Text type="secondary">
                  Revenue vs Discount vs Net Revenue (2024)
                </Typography.Text>
              }
            >
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
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card
              title="Weekly Revenue Breakdown"
              extra={
                <Typography.Text type="secondary">
                  October 2024 - Weekly Performance
                </Typography.Text>
              }
            >
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
            </Card>
          </Col>
        </Row>

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
