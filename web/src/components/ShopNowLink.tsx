import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { scrollToTopNow } from './ScrollToTop'

type Props = {
  className?: string
  children?: React.ReactNode
}

const ShopNowLink = ({ className, children = 'Shop Now' }: Props) => {
  const { isAuthenticated, hasRole } = useAuth()
  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'))
  const scrollToTop = () => {
    scrollToTopNow()
  }

  if (canShop) return <Link to="/marketplace" onClick={scrollToTop} className={className}>{children}</Link>
  if (isAuthenticated && hasRole('delivery')) return null
  return (
    <Link to="/login" state={{ from: '/marketplace' }} onClick={scrollToTop} className={className}>
      {children}
    </Link>
  )
}

export default ShopNowLink
