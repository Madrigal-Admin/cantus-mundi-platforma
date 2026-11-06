import { createContext, useContext } from 'react'

export const SiteContext = createContext({ settings: {} })
export const useSite = () => useContext(SiteContext)
