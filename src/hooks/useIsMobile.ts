import { useEffect, useState } from 'react'

/**
 * Returns true when the viewport width is below `breakpoint` (default: 768px).
 * Initialises synchronously from window.innerWidth so there's no layout flash.
 */
export function useIsMobile(breakpoint = 768): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < breakpoint)

  useEffect(() => {
    const update = () => setIsMobile(window.innerWidth < breakpoint)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [breakpoint])

  return isMobile
}
