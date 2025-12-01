import { Link } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Model1 from '../../../assets/SharedAsset/Model1.jpg'
import Model2 from '../../../assets/SharedAsset/Model2.jpg'
import Model3 from '../../../assets/SharedAsset/Model3.jpg'

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0)
  
  const slides = [
    {
      id: 1,
      image: Model1
    },
    {
      id: 2,
      image: Model2
    },
    {
      id: 3,
      image: Model3
    }
  ]

  // Auto-play carousel
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length)
    }, 5000) // Change slide every 5 seconds

    return () => clearInterval(interval)
  }, [slides.length])

  return (
    <div className="bg-white">
      {/* Carousel - 75vh */}
      <section className="relative w-full overflow-hidden" style={{ height: '100vh' }}>
        {/* Slides */}
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Background Image - Full Screen */}
            <div 
              className="w-full h-full bg-cover bg-center bg-no-repeat"
              style={{ 
                backgroundImage: `url(${slide.image})`
              }}
            />
          </div>
        ))}
      </section>

      <section className="relative -mt-24 z-10 mb-16">
        <div className="container mx-auto px-15">
          <div className="bg-white rounded-3xl shadow-xl px-20 py-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 text-gray-800 max-w-6xl mx-auto">
            <div className="flex flex-col items-center text-center md:text-left md:items-start w-full">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Layanan pelanggan</h2>
              <a href="https://wa.me/628985452559" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-red-400 transition-colors">
                <div className="w-10 h-10 bg-red-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                </div>
                <span className="text-lg">089-854-525-596</span>
              </a>
            </div>
            <div className="flex flex-col items-center text-center md:text-left md:items-start w-full">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Kantor pusat</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <div className="text-base leading-relaxed">
                  <p>Jl. Gubeng Kertajaya V F Blok F No.32, Airlangga, Kec. Gubeng, Surabaya</p>
                  <p>RT.007/RW.03</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col items-center text-center md:text-left md:items-start w-full ms-10">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Jam operasional</h2>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-300 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-base leading-relaxed">
                  <p>Open Tuesday - Sunday</p>
                  <p>9.00 - 18.00</p>
                </div>
              </div>
            </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-gradient-to-b from-white to-pink-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Our Services</h2>
            <div className="w-24 h-1 bg-red-400 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Service Item */}
            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Cutting / Blow</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Creambath</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Make Up</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">Massage</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Pelurusan / Smoothing / Ion</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Pengeritingan</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Pewarnaan / Highlight</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Cuci Blow / Blow Extension</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Hair Extension</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Facial</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Manicure Pedicure</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Perawatan Badan</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Hair Mask</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Body Spa</h3>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-md p-6 border border-pink-100">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                <h3 className="text-lg font-semibold text-gray-900">Hair Spa</h3>
              </div>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/customer/book">
              <button className="bg-red-400 hover:bg-red-500 text-white font-semibold py-3 px-10 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-lg">
                View Services
              </button>
            </Link>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home