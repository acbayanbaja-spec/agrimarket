import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  className?: string
  children?: React.ReactNode
}

const ShopNowLink = ({ className, children = 'Shop Now' }: Props) => {
  const { isAuthenticated, hasRole } = useAuth()
  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'))
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0
  }

  if (canShop) return <Link to="/marketplace" onClick={scrollToTop} className={className}>{children}</Link>
  if (isAuthenticated && hasRole('delivery')) return <Link to="/delivery" onClick={scrollToTop} className={className}>Open rider desk</Link>
  return (
    <Link to="/login" state={{ from: '/marketplace' }} onClick={scrollToTop} className={className}>
      {children}
    </Link>
  )
}

export default ShopNowLink
