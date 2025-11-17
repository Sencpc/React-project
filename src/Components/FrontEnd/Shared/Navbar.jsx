import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth, ROLE_REDIRECTS } from "../../../context/AuthContext";
import logo from "../../../assets/SharedAsset/logo.png";

const Navbar = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = (
    <>
      <li className="relative group">
        <Link
          to="/"
          onClick={() => setIsOpen(false)}
          className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
        >
          Home
          <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </li>
      <li className="relative group">
        <Link
          to="/blog"
          onClick={() => setIsOpen(false)}
          className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
        >
          Blog
          <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </li>
      <li className="relative group">
        <Link
          to={isAuthenticated ? "/customer/book" : "/book"}
          onClick={() => setIsOpen(false)}
          className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
        >
          Services
          <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </li>
      <li className="relative group">
        <Link
          to={isAuthenticated ? "/customer/about" : "/about"}
          onClick={() => setIsOpen(false)}
          className="text-gray-800 font-semibold text-lg transition-all duration-300 ease-in-out hover:text-red-400 relative"
        >
          About Us
          <span className="absolute bottom-0 left-0 w-0 h-0.5  bg-red-300 transition-all duration-300 group-hover:w-full"></span>
        </Link>
      </li>
    </>
  );

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

            {/* Desktop Navigation Menu */}
            <ul className="hidden md:flex space-x-6 items-center">
              {navLinks}

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

            {/* Mobile: Hamburger */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
                className="p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-red-300"
              >
                <svg className="w-6 h-6 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Backdrop (only when open) */}
      {isOpen && (
        <div className="fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black bg-opacity-40"
            onClick={() => setIsOpen(false)}
          />
        </div>
      )}

      {/* Sidebar panel (slides from right) */}
      <aside
        className={`fixed top-0 right-0 h-full w-72 max-w-full bg-white shadow-2xl p-6 overflow-auto z-60 transform transition-transform duration-300 ${isOpen ? "translate-x-0" : "translate-x-full"}`}
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between mb-6">
          <Link to="/" onClick={() => setIsOpen(false)} className="flex items-center space-x-3">
            <img src={logo} alt="Logo" className="h-10 w-10 object-cover rounded-full" />
            <span className="text-lg font-bold">Flower Beauty</span>
          </Link>
          <button onClick={() => setIsOpen(false)} aria-label="Close menu" className="p-2 rounded-md">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <ul className="space-y-4">
          {navLinks}

          {isAuthenticated ? (
            <>
              <li>
                <Link to="/customer/profile" onClick={() => setIsOpen(false)} className="flex items-center gap-2 text-gray-800">
                  <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span>Hi, {user?.fullName?.split(" ")[0] || "Guest"}</span>
                </Link>
              </li>
              <li>
                <button onClick={() => { logout(); setIsOpen(false); }} className="w-full text-left bg-red-400 hover:bg-red-500 text-white font-bold px-4 py-3 rounded-full">Log out</button>
              </li>
            </>
          ) : (
            <li>
              <Link to="/login" onClick={() => setIsOpen(false)}>
                <button className="w-full text-left bg-red-400 hover:bg-red-500 text-white font-bold px-4 py-3 rounded-full">Login</button>
              </Link>
            </li>
          )}
        </ul>
      </aside>
    </div>
  );
};

export default Navbar;
