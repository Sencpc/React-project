const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-red-50 via-white to-pink-50">
      <div className="text-center space-y-8">
        {/* Animated Dots */}
        <div className="flex items-center justify-center gap-3 h-16">
          <div 
            className="w-4 h-4 bg-red-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: '0s'
            }}
          ></div>
          <div 
            className="w-4 h-4 bg-red-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: '0.2s'
            }}
          ></div>
          <div 
            className="w-4 h-4 bg-red-400 rounded-full"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: '0.4s'
            }}
          ></div>
        </div>

        {/* Loading Text */}
        <p className="text-sm text-gray-600">
          Please wait...
        </p>
      </div>

      {/* Custom CSS for bounce animation */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          40% {
            transform: translateY(-20px);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export default LoadingScreen
