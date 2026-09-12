import React, { createContext, useCallback, useContext, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

type Toast = { id: number; message: string }

type ToastContextType = {
  toast: (message: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string) => {
    const id = Date.now()
    setToasts((current) => [...current.slice(-1), { id, message }])
    setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 2800)
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <View pointerEvents="box-none" style={styles.stack}>
        {toasts.map((item) => (
          <Pressable key={item.id} style={styles.toast} onPress={() => setToasts((current) => current.filter((entry) => entry.id !== item.id))}>
            <Text style={styles.text}>{item.message}</Text>
          </Pressable>
        ))}
      </View>
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}

const styles = StyleSheet.create({
  stack: { position: 'absolute', top: 54, left: 16, right: 16, gap: 8, zIndex: 80 },
  toast: { backgroundColor: '#14532d', borderRadius: 16, paddingVertical: 12, paddingHorizontal: 16 },
  text: { color: '#fff', fontWeight: '700', textAlign: 'center' },
})
