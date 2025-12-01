import { Link } from "react-router-dom";
import { useAuth, ROLE_REDIRECTS } from "../../../context/AuthContext";
import logo from "../../../assets/SharedAsset/logo.png";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();

  return (
    <div className="my-3">
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-gray-200">
        <nav className="container mx-auto px-6 py-2">
          <div className="flex justify-between items-center">
            {/* Logo/Brand */}
            <Link to="/" className="flex items-center space-x-3">
              <img
                src={logo}
                alt="Flower Beauty Salon Logo"
                className="h-12 w-12 object-cover rounded-full"
              />
              <span className="text-2xl font-bold bg-red-300 bg-clip-text text-transparent">
                Flower Beauty Salon
              </span>
            </Link>

            {/* Navigation Menu */}
            <ul className="flex space-x-6 items-center">
              <li className="relative group">
                <Link
                  to="/"
                  className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
                >
                  Home
                  <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li className="relative group">
                <Link
                  to="/blog"
                  className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
                >
                  Blog
                  <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              <li className="relative group">
                <Link
                  to={isAuthenticated ? "/customer/book" : "/book"}
                  className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
                >
                  Services
                  <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
                </Link>
              </li>
              {isAuthenticated ? (
                <>
                  <li className="relative group">
                    <Link
                      to="/customer/profile"
                      className="text-gray-800 font-semibold text-lg flex items-center gap-2 transition-all duration-300 ease-in-out hover:text-red-400"
                    >
                      <svg
                        className="w-5 h-5 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>Hi, {user?.fullName?.split(" ")[0] || "Guest"}</span>
                    </Link>
                  </li>
                  <li className="ml-4">
                    <button
                      onClick={logout}
                      className="relative overflow-hidden bg-red-400 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 group cursor-pointer"
                    >
                      <span className="relative z-10">Log out</span>
                      <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </li>
                </>
              ) : (
                <li>
                  <Link to="/login">
                    <button className="relative overflow-hidden bg-red-400 hover:bg-red-500 text-white font-bold px-8 py-3 rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 group cursor-pointer">
                      <span className="relative z-10">Login</span>
                      <div className="absolute inset-0 bg-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </button>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </nav>
      </header>
    </div>
  );
};

export default Navbar;
