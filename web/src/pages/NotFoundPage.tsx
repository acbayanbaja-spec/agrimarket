import { Link } from 'react-router-dom'

const NotFoundPage = () => (
  <div className="page-shell max-w-lg text-center">
    <h1 className="text-4xl font-bold mb-3">Page not found</h1>
    <p className="text-gray-600 mb-6">That path is not on the farm map. Try the marketplace instead.</p>
    <div className="flex justify-center gap-3">
      <Link to="/" className="btn-outline">Home</Link>
      <Link to="/marketplace" className="btn-primary">Marketplace</Link>
    </div>
  </div>
)

export default NotFoundPage
