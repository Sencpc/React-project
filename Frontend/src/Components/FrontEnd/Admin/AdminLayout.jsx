import { useState } from "react";
import { useAuth } from "../../../context/AuthContext";
import Sidebar from "./Sidebar";

const AdminLayout = ({ children, title }) => {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col relative">
        {/* Top bar - Sticky */}
        <div className="sticky top-0 z-50 flex-shrink-0 flex h-16 bg-white shadow-sm border-b border-gray-200">
          <button
            className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-red-500"
            onClick={toggleSidebar}
          >
            {/* Hamburger Icon - Bootstrap Style */}
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
            <div className="ml-4 mr-23 flex items-center space-x-3">
              <span className="text-m text-gray-500">
                Welcome, {user?.fullName || "Admin"}
              </span>
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

export default AdminLayout;