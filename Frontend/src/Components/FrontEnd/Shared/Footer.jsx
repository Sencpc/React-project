import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="bg-black text-white py-16 px-8">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo Section */}
          <div className="col-span-1">
            <div className="text-6xl font-bold text-white mb-8">
              Flower Beauty Salon
            </div>
            
            {/* Copyright */}
            <div className="text-sm text-gray-400 mt-12">
              <p>©2025 PLACEHOLDER. All rights reserved.</p>
              <p className="mt-2">No part of this website may be reproduced without permission.</p>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="col-span-1">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-6">NAVIGATION</h3>
              <ul className="space-y-3">
                <li>
                  <Link to="/blog" className="text-gray-300 hover:text-white transition-colors duration-300">
                    BLOG
                  </Link>
                </li>
                <li>
                  <Link to="/gallery" className="text-gray-300 hover:text-white transition-colors duration-300">
                    GALLERY
                  </Link>
                </li>
                <li>
                  <Link to="/pricelist" className="text-gray-300 hover:text-white transition-colors duration-300">
                    PRICE LIST
                  </Link>
                </li>
                <li>
                  <a href="#" className="text-gray-300 hover:text-white transition-colors duration-300">
                    CONTACT
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Studio Info */}
          <div className="col-span-1">
            <h3 className="text-lg font-semibold text-white mb-6">STUDIO</h3>
            <div className="space-y-2 text-gray-300">
              <p>Flowers Beauty Salon</p>
              <p>Jl. Gubeng Kertajaya V F Blok F No.32</p>
              <p>RT.007/RW.03, Airlangga, Kec. Gubeng, Surabaya, Jawa Timur 60286</p>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="col-span-1">
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-white mb-6">GET IN TOUCH</h3>
              <p className="text-gray-300">(+62) 898-5452-559</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
