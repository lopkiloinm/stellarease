"use client"

import { useEffect, useRef, useState } from "react"

type AnimationType = "fade-up" | "fade-in" | "zoom-in" | "slide-left" | "slide-right" | "glow-pulse"

export function useScrollAnimation<T extends HTMLElement = HTMLDivElement>({
  animation = "fade-up",
  delay = 0,
  threshold = 0.1,
  rootMargin = "0px"
}: {
  animation?: AnimationType
  delay?: number
  threshold?: number
  rootMargin?: string
} = {}) {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            setIsVisible(true)
          }, delay)
          if (ref.current) observer.unobserve(ref.current)
        }
      },
      { threshold, rootMargin }
    )

    const currentRef = ref.current
    if (currentRef) {
      observer.observe(currentRef)
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef)
      }
    }
  }, [threshold, rootMargin, delay])

  const animationClass = isVisible ? `animate-${animation}` : "opacity-0"

  return { ref, isVisible, animationClass }
}
