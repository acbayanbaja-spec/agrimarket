import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './context/AuthContext'
import { CartProvider } from './context/CartContext'
import { StoreProvider } from './context/StoreContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/HomePage'
import MarketplacePage from './pages/MarketplacePage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ProfilePage from './pages/ProfilePage'
import OrdersPage from './pages/OrdersPage'
import ReceiptPage from './pages/ReceiptPage'
import SellerDashboardPage from './pages/SellerDashboardPage'
import AdminDashboardPage from './pages/AdminDashboardPage'
import BecomeSellerPage from './pages/BecomeSellerPage'
import CategoriesPage from './pages/CategoriesPage'
import SellersPage from './pages/SellersPage'
import ContentPage from './pages/ContentPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import NotFoundPage from './pages/NotFoundPage'
import FeedPage from './pages/FeedPage'
import TradesPage from './pages/TradesPage'
import MessagesPage from './pages/MessagesPage'
import DeliveryDashboardPage from './pages/DeliveryDashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import PriceMonitorPage from './pages/PriceMonitorPage'
import GetTheAppPage from './pages/GetTheAppPage'
import { ToastProvider } from './context/ToastContext'
import { CartSheetProvider } from './context/CartSheetContext'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <StoreProvider>
            <Router>
            <ToastProvider>
            <CartSheetProvider>
              <Routes>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<HomePage />} />
                  <Route path="marketplace" element={<MarketplacePage />} />
                  <Route path="products/:id" element={<ProductDetailPage />} />
                  <Route path="cart" element={<CartPage />} />
                  <Route path="checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                  <Route path="login" element={<LoginPage />} />
                  <Route path="register" element={<RegisterPage />} />
                  <Route path="forgot-password" element={<ForgotPasswordPage />} />
                  <Route path="profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                  <Route path="orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                  <Route path="orders/:id/receipt" element={<ProtectedRoute><ReceiptPage /></ProtectedRoute>} />
                  <Route path="seller-dashboard" element={<ProtectedRoute roles={['seller', 'admin']}><SellerDashboardPage /></ProtectedRoute>} />
                  <Route path="admin-dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboardPage /></ProtectedRoute>} />
                  <Route path="delivery" element={<ProtectedRoute roles={['delivery', 'admin']}><DeliveryDashboardPage /></ProtectedRoute>} />
                  <Route path="analytics" element={<ProtectedRoute roles={['seller', 'admin']}><AnalyticsPage /></ProtectedRoute>} />
                  <Route path="become-seller" element={<ProtectedRoute><BecomeSellerPage /></ProtectedRoute>} />
                  <Route path="messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
                  <Route path="feed" element={<FeedPage />} />
                  <Route path="trades" element={<TradesPage />} />
                  <Route path="prices" element={<PriceMonitorPage />} />
                  <Route path="categories" element={<CategoriesPage />} />
                  <Route path="sellers" element={<SellersPage />} />
                  <Route path="help" element={<ContentPage slug="help" />} />
                  <Route path="contact" element={<ContentPage slug="contact" />} />
                  <Route path="faq" element={<ContentPage slug="faq" />} />
                  <Route path="terms" element={<ContentPage slug="terms" />} />
                  <Route path="privacy" element={<ContentPage slug="privacy" />} />
                  <Route path="shipping" element={<ContentPage slug="shipping" />} />
                  <Route path="get-app" element={<GetTheAppPage />} />
                  <Route path="*" element={<NotFoundPage />} />
                </Route>
              </Routes>
            </CartSheetProvider>
            </ToastProvider>
            </Router>
          </StoreProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}

export default App
