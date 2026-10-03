import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

type Props = {
  className?: string
  children?: React.ReactNode
}

const ShopNowLink = ({ className, children = 'Shop Now' }: Props) => {
  const { isAuthenticated, hasRole } = useAuth()
  const canShop = isAuthenticated && (hasRole('buyer') || hasRole('seller') || hasRole('admin'))
  if (canShop) return <Link to="/marketplace" className={className}>{children}</Link>
  if (isAuthenticated && hasRole('delivery')) return <Link to="/delivery" className={className}>Open rider desk</Link>
  return (
    <Link to="/login" state={{ from: '/marketplace' }} className={className}>
      {children}
    </Link>
  )
}

export default ShopNowLink
