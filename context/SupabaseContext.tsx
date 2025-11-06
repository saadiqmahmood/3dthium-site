import type { SupabaseClient } from '@supabase/supabase-js'
import { createContext, type ReactNode, useContext } from 'react'

type SupabaseContextType = {
  client: SupabaseClient
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined)

export const SupabaseContextProvider = ({
  children,
  client,
}: {
  children: ReactNode
  client: SupabaseClient
}) => {
  return <SupabaseContext.Provider value={{ client }}>{children}</SupabaseContext.Provider>
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    // Return null instead of throwing to allow graceful error handling
    return null
  }
  return context
}
