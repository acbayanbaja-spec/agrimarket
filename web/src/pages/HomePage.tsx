import { Link } from 'react-router-dom'
import { ArrowRight, Truck, Shield, Leaf } from 'lucide-react'

const HomePage = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Fresh Agricultural Products
              <br />
              Direct from Farmers
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-primary-100">
              Connect with local farmers and get the freshest produce delivered to your doorstep
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/marketplace" className="btn-primary bg-white text-primary-600 hover:bg-primary-50">
                Browse Marketplace
              </Link>
              <Link to="/become-seller" className="btn-outline border-white text-white hover:bg-white/10">
                Become a Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Leaf className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fresh & Organic</h3>
              <p className="text-gray-600">
                Direct from farms, ensuring the freshest produce for your family
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Truck className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
              <p className="text-gray-600">
                Reliable delivery network bringing products to your doorstep
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-primary-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Shield className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Verified Sellers</h3>
              <p className="text-gray-600">
                All sellers are verified to ensure quality and trust
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Preview */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Browse by Category</h2>
            <p className="text-gray-600">Find exactly what you're looking for</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {['Vegetables', 'Fruits', 'Rice & Grains', 'Livestock', 'Poultry', 'Fish', 'Seeds', 'Farm Supplies'].map((category) => (
              <Link
                key={category}
                to="/marketplace"
                className="bg-white rounded-lg p-6 text-center hover:shadow-lg transition-shadow cursor-pointer"
              >
                <div className="bg-primary-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <Leaf className="h-8 w-8 text-primary-600" />
                </div>
                <h3 className="font-semibold">{category}</h3>
              </Link>
            ))}
          </div>
          
          <div className="text-center mt-8">
            <Link to="/marketplace" className="btn-primary inline-flex items-center">
              View All Categories
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Selling?</h2>
          <p className="text-xl mb-8 text-primary-100">
            Join thousands of farmers and agricultural businesses on our platform
          </p>
          <Link to="/become-seller" className="btn-primary bg-white text-primary-600 hover:bg-primary-50">
            Apply to Become a Seller
          </Link>
        </div>
      </section>
    </div>
  )
}

export default HomePage
