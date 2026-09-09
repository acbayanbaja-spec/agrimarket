import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { products as catalogProducts, type Product } from '../data/catalog'
import { useAuth } from './AuthContext'

export type OrderItem = {
  productId: string
  name: string
  price: number
  quantity: number
  image: string
}

export type Order = {
  id: string
  userId: number
  items: OrderItem[]
  total: number
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered'
  createdAt: string
  address: string
  payment: string
}

export type SellerApplication = {
  id: string
  userId: number
  name: string
  farmName: string
  location: string
  description: string
  status: 'Pending' | 'Approved' | 'Rejected'
  createdAt: string
}

type StoreContextType = {
  products: Product[]
  orders: Order[]
  applications: SellerApplication[]
  addProduct: (product: Omit<Product, 'id' | 'sellerId' | 'seller' | 'rating' | 'reviews'>) => void
  removeProduct: (id: string) => void
  placeOrder: (order: Omit<Order, 'id' | 'createdAt' | 'userId' | 'status'>) => Order
  myOrders: Order[]
  submitApplication: (payload: Omit<SellerApplication, 'id' | 'createdAt' | 'status' | 'userId' | 'name'>) => SellerApplication
  myApplication: SellerApplication | undefined
  reviewApplication: (id: string, status: 'Approved' | 'Rejected') => void
  updateOrderStatus: (id: string, status: Order['status']) => void
  myListings: Product[]
}

const StoreContext = createContext<StoreContextType | undefined>(undefined)
const APPROVED_KEY = 'agrimarket.approvedSellers'

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, addRole } = useAuth()
  const [extraProducts, setExtraProducts] = useState<Product[]>([])
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [applications, setApplications] = useState<SellerApplication[]>([])
  const [approvedSellerIds, setApprovedSellerIds] = useState<number[]>([])

  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('agrimarket.extraProducts')
      const storedHidden = localStorage.getItem('agrimarket.hiddenProducts')
      const storedOrders = localStorage.getItem('agrimarket.orders')
      const storedApps = localStorage.getItem('agrimarket.applications')
      const storedApproved = localStorage.getItem(APPROVED_KEY)
      if (storedProducts) setExtraProducts(JSON.parse(storedProducts))
      if (storedHidden) setHiddenIds(JSON.parse(storedHidden))
      if (storedOrders) setOrders(JSON.parse(storedOrders))
      if (storedApps) setApplications(JSON.parse(storedApps))
      if (storedApproved) setApprovedSellerIds(JSON.parse(storedApproved))
    } catch {
      /* ignore corrupt storage */
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('agrimarket.extraProducts', JSON.stringify(extraProducts))
  }, [extraProducts])
  useEffect(() => {
    localStorage.setItem('agrimarket.hiddenProducts', JSON.stringify(hiddenIds))
  }, [hiddenIds])
  useEffect(() => {
    localStorage.setItem('agrimarket.orders', JSON.stringify(orders))
  }, [orders])
  useEffect(() => {
    localStorage.setItem('agrimarket.applications', JSON.stringify(applications))
  }, [applications])
  useEffect(() => {
    localStorage.setItem(APPROVED_KEY, JSON.stringify(approvedSellerIds))
  }, [approvedSellerIds])

  useEffect(() => {
    if (user && approvedSellerIds.includes(user.id)) {
      addRole('seller')
    }
  }, [user, approvedSellerIds, addRole])

  const products = useMemo(
    () => [...extraProducts, ...catalogProducts].filter((product) => !hiddenIds.includes(product.id)),
    [extraProducts, hiddenIds]
  )

  const addProduct: StoreContextType['addProduct'] = (product) => {
    const next: Product = {
      ...product,
      id: `custom-${Date.now()}`,
      seller: user ? `${user.firstName} ${user.lastName}` : 'Independent Farm',
      sellerId: user ? `user-${user.id}` : 'seller-local',
      rating: 5,
      reviews: 0,
    }
    setExtraProducts((current) => [next, ...current])
  }

  const removeProduct = (id: string) => {
    setExtraProducts((current) => current.filter((product) => product.id !== id))
    if (catalogProducts.some((product) => product.id === id)) {
      setHiddenIds((current) => [...current, id])
    }
  }

  const placeOrder: StoreContextType['placeOrder'] = (order) => {
    const next: Order = {
      ...order,
      id: `ORD-${Date.now().toString().slice(-8)}`,
      userId: user?.id || 0,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    setOrders((current) => [next, ...current])
    return next
  }

  const submitApplication: StoreContextType['submitApplication'] = (payload) => {
    const next: SellerApplication = {
      ...payload,
      id: `APP-${Date.now().toString().slice(-8)}`,
      userId: user?.id || 0,
      name: user ? `${user.firstName} ${user.lastName}` : 'Guest',
      status: 'Pending',
      createdAt: new Date().toISOString(),
    }
    setApplications((current) => [next, ...current.filter((item) => item.userId !== next.userId)])
    return next
  }

  const reviewApplication = (id: string, status: 'Approved' | 'Rejected') => {
    setApplications((current) => {
      const target = current.find((item) => item.id === id)
      if (status === 'Approved' && target) {
        setApprovedSellerIds((ids) => (ids.includes(target.userId) ? ids : [...ids, target.userId]))
        if (user && target.userId === user.id) addRole('seller')
      }
      return current.map((item) => (item.id === id ? { ...item, status } : item))
    })
  }

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders((current) => current.map((order) => (order.id === id ? { ...order, status } : order)))
  }

  const myListings = useMemo(() => {
    if (!user) return []
    return products.filter((product) => {
      if (product.sellerId === `user-${user.id}`) return true
      if (user.email === 'seller@agrimarket.com' && product.sellerId === 'seller-1') return true
      return false
    })
  }, [products, user])

  const value = useMemo<StoreContextType>(
    () => ({
      products,
      orders,
      applications,
      addProduct,
      removeProduct,
      placeOrder,
      myOrders: orders.filter((order) => user && order.userId === user.id),
      submitApplication,
      myApplication: applications.find((item) => user && item.userId === user.id),
      reviewApplication,
      updateOrderStatus,
      myListings,
    }),
    [products, orders, applications, user, myListings]
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export const useStore = () => {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within a StoreProvider')
  return context
}
