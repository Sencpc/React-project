import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";

const CustomerSidebar = ({ sidebarOpen, toggleSidebar }) => {
  const location = useLocation();
  const { logout } = useAuth();

  const menuItems = [
    {
      name: "Dashboard",
      path: "/customer/dashboard",
      icon: "svg",
      svg: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          ></path>
        </>
      ),
    },
    {
      name: "Profile",
      path: "/customer/profile",
      icon: "svg",
      svg: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        ></path>
      ),
    },
    {
      name: "Coupon",
      path: "/customer/coupon",
      icon: "svg",
      svg: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.99 1.99 0 013 12V7a4 4 0 014-4z"
        ></path>
      ),
    },
    {
      name: "History",
      path: "/customer/history",
      icon: "svg",
      svg: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        ></path>
      ),
    },
    {
      name: "Cart",
      path: "/customer/cart",
      icon: "svg",
      svg: (
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M3 3h2l.4 2M7 13h10l3-8H5.4M7 13l-1.293 2.586A1 1 0 006.618 17H18m-9 4a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z"
        ></path>
      ),
    },
    {
      name: "Settings",
      path: "/customer/settings",
      icon: "svg",
      svg: (
        <>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          ></path>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          ></path>
        </>
      ),
    },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <div
      className={`fixed inset-y-0 left-0 z-40 w-64 bg-white shadow-lg transform ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      } transition-transform duration-300 ease-in-out`}
    >
      {/* Navigation Menu */}
      <nav className="mt-20 px-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => (
            <li key={index}>
              <Link
                to={item.path}
                onClick={() => {
                  if (sidebarOpen) {
                    toggleSidebar();
                  }
                }}
                className={`group flex items-center px-4 py-4 text-m font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? "bg-red-50 text-red-600"
                    : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                }`}
              >
                <svg
                  className={`mr-3 h-5 w-5 transition-colors duration-200 ${
                    isActive(item.path)
                      ? "text-red-500"
                      : "text-gray-400 group-hover:text-red-500"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {item.svg}
                </svg>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 w-full p-4">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-red-400 rounded-lg hover:bg-red-500 transition-all duration-200 transform hover:scale-105 cursor-pointer"
        >
          <svg
            className="mr-3 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            ></path>
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default CustomerSidebar;
