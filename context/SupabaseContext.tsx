import { createContext, useContext, ReactNode } from 'react'
import { SupabaseClient } from '@supabase/supabase-js'

type SupabaseContextType = {
  client: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const SupabaseContextProvider = ({ 
  children, 
  client 
}: { 
  children: ReactNode
  client: SupabaseClient 
}) => {
  return (
    <SupabaseContext.Provider value={{ client }}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within a SupabaseContextProvider')
  }
  return context
} 