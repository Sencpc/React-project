import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import CustomerSidebar from "./CustomerSidebar";

const CustomerDashboardLayout = ({ children, title }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <CustomerSidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar - Sticky */}
        <div className="sticky top-0 z-50 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
            onClick={toggleSidebar}
          >
            {/* Hamburger Icon */}
            <div className="w-6 h-6 flex flex-col justify-center items-center space-y-1">
              <div
                className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
                  sidebarOpen ? "rotate-45 translate-y-1.5" : ""
                }`}
              ></div>
              <div
                className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
                  sidebarOpen ? "opacity-0" : ""
                }`}
              ></div>
              <div
                className={`w-5 h-0.5 bg-gray-600 transition-all duration-300 ${
                  sidebarOpen ? "-rotate-45 -translate-y-1.5" : ""
                }`}
              ></div>
            </div>
          </button>

          <div className="flex-1 px-4 flex justify-between items-center">
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 ms-9">{title}</h2>
            </div>
            <div className="ml-4 mr-23 flex items-center space-x-6">
              <span className="text-m text-gray-500">
                Welcome, {user?.fullName || "Customer"}
              </span>
              <a
                href="/"
                className="px-4 py-2 bg-red-400 text-white text-sm font-medium rounded-lg hover:bg-red-500 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-house" viewBox="0 0 16 16">
                <path d="M8.707 1.5a1 1 0 0 0-1.414 0L.646 8.146a.5.5 0 0 0 .708.708L2 8.207V13.5A1.5 1.5 0 0 0 3.5 15h9a1.5 1.5 0 0 0 1.5-1.5V8.207l.646.647a.5.5 0 0 0 .708-.708L13 5.793V2.5a.5.5 0 0 0-.5-.5h-1a.5.5 0 0 0-.5.5v1.293zM13 7.207V13.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V7.207l5-5z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50">
          {children}
        </main>
      </div>

      {/* Clickable Overlay*/}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30" onClick={toggleSidebar}></div>
      )}
    </div>
  );
};

export default CustomerDashboardLayout;
