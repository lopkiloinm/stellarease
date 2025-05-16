"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight, Shield, Zap, Fingerprint, User, Search, Clock, X, Database, Laptop, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useScrollAnimation } from "@/lib/hooks/use-scroll-animation"
import { account, server } from '@/lib/common'
import base64url from 'base64url'

export default function Home() {
  const router = useRouter()
  const [passkeyName, setPasskeyName] = useState("")
  const [hasScrolled, setHasScrolled] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // State for mock UI animations
  const [isContactsHovered, setIsContactsHovered] = useState(false)
  const [isQrHovered, setIsQrHovered] = useState(false)
  const [qrScanState, setQrScanState] = useState("scanning")
  const [isTransferHovered, setIsTransferHovered] = useState(false)
  const [transferState, setTransferState] = useState("initial")
  const [transferAmount, setTransferAmount] = useState("0.00")

  // Refs for animation timers
  const contactsTimerRef = useRef<NodeJS.Timeout | null>(null)
  const qrTimerRef = useRef<NodeJS.Timeout | null>(null)
  const transferTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Animation hooks for different sections
  const titleAnimation = useScrollAnimation({ animation: "fade-in" })
  const formAnimation = useScrollAnimation<HTMLFormElement>({ animation: "fade-up", delay: 200 })
  const headingAnimation = useScrollAnimation({ animation: "fade-up" })
  const descriptionAnimation = useScrollAnimation({ animation: "fade-up", delay: 200 })

  const card1Animation = useScrollAnimation({ animation: "fade-up" })
  const card2Animation = useScrollAnimation({ animation: "fade-up" })
  const card3Animation = useScrollAnimation({ animation: "fade-up" })
  const card4Animation = useScrollAnimation({ animation: "fade-up" })

  const seedPhraseAnimation = useScrollAnimation({ animation: "fade-in" })
  const feature1Animation = useScrollAnimation({ animation: "slide-left" })
  const feature2Animation = useScrollAnimation({ animation: "slide-right" })
  const feature3Animation = useScrollAnimation({ animation: "slide-left" })
  const feature4Animation = useScrollAnimation({ animation: "slide-right" })

  const ctaAnimation = useScrollAnimation({ animation: "fade-up" })

  // Track scroll position for parallax effects and progress
  useEffect(() => {
    const handleScroll = () => {
      setHasScrolled(window.scrollY > 50)

      // Calculate scroll progress percentage
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight
      const scrollTop = window.scrollY
      const scrollDistance = documentHeight - windowHeight
      const progress = (scrollTop / scrollDistance) * 100
      setScrollProgress(Math.min(progress, 100))

      // Handle mobile scroll-based hover effects
      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024)
      if (isMobile) {
        const cards = document.querySelectorAll('.interactive-feature-card, .simple-feature-card')
        cards.forEach(card => {
          const rect = card.getBoundingClientRect()
          const triggerPoint = windowHeight * 0.8
          const isInView = rect.top < triggerPoint

          // Add/remove in-view class
          card.classList.toggle('in-view', isInView)

          // Trigger specific animations based on card type
          if (isInView) {
            // Contact list animation
            if (card.classList.contains('interactive-feature-card-blue')) {
              setIsContactsHovered(true)
            }
            // QR code animation
            else if (card.classList.contains('interactive-feature-card-purple')) {
              setIsQrHovered(true)
            }
            // Transfer animation
            else if (card.classList.contains('interactive-feature-card-indigo')) {
              setIsTransferHovered(true)
            }
          } else {
            // Reset animations when card is out of view
            if (card.classList.contains('interactive-feature-card-blue')) {
              setIsContactsHovered(false)
            }
            else if (card.classList.contains('interactive-feature-card-purple')) {
              setIsQrHovered(false)
            }
            else if (card.classList.contains('interactive-feature-card-indigo')) {
              setIsTransferHovered(false)
            }
          }
        })
      }
    }

    // Add resize handler to update mobile state
    const handleResize = () => {
      const isMobile = window.innerWidth < 768 || ('ontouchstart' in window && window.innerWidth < 1024)
      if (isMobile) {
        handleScroll() // Trigger scroll handler to update card states
      }
    }

    // Use requestAnimationFrame for smoother scroll handling
    let ticking = false
    const scrollHandler = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll()
          ticking = false
        })
        ticking = true
      }
    }

    window.addEventListener("scroll", scrollHandler, { passive: true })
    window.addEventListener("resize", handleResize, { passive: true })
    
    // Initial check for cards in view
    handleScroll()
    
    return () => {
      window.removeEventListener("scroll", scrollHandler)
      window.removeEventListener("resize", handleResize)
    }
  }, [])

  // Handle QR code scanner animation
  useEffect(() => {
    if (isQrHovered) {
      // Start QR animation cycle
      setQrScanState("scanning")

      qrTimerRef.current = setTimeout(() => {
        setQrScanState("success")

        qrTimerRef.current = setTimeout(() => {
          setQrScanState("scanning")

          // Repeat the cycle
          const cycleQrAnimation = () => {
            qrTimerRef.current = setTimeout(() => {
              setQrScanState("success")

              qrTimerRef.current = setTimeout(() => {
                setQrScanState("scanning")
                cycleQrAnimation()
              }, 2000)
            }, 2000)
          }

          cycleQrAnimation()
        }, 2000)
      }, 2000)
    } else {
      // Clear timers when not hovering
      if (qrTimerRef.current) {
        clearTimeout(qrTimerRef.current)
        qrTimerRef.current = null
      }
      setQrScanState("scanning")
    }

    return () => {
      if (qrTimerRef.current) {
        clearTimeout(qrTimerRef.current)
      }
    }
  }, [isQrHovered])

  // Handle transfer animation
  useEffect(() => {
    if (isTransferHovered) {
      // Start transfer animation cycle
      setTransferState("initial")
      setTransferAmount("0.00")

      // Select asset
      transferTimerRef.current = setTimeout(() => {
        setTransferState("asset-selected")

        // Enter amount with typing animation
        transferTimerRef.current = setTimeout(() => {
          setTransferState("amount-entered")

          // Simulate typing animation for the amount
          const finalAmount = "50.00"
          let currentIndex = 0

          const typeAmount = () => {
            if (currentIndex <= finalAmount.length) {
              setTransferAmount(finalAmount.substring(0, currentIndex))
              currentIndex++

              if (currentIndex <= finalAmount.length) {
                // Random typing speed between 100-200ms for natural effect
                const typingSpeed = Math.floor(Math.random() * 100) + 100
                transferTimerRef.current = setTimeout(typeAmount, typingSpeed)
              } else {
                // Move to next step after typing is complete
                transferTimerRef.current = setTimeout(() => {
                  setTransferState("sending")

                  // Complete
                  transferTimerRef.current = setTimeout(() => {
                    setTransferState("complete")

                    // Reset and repeat
                    transferTimerRef.current = setTimeout(() => {
                      setTransferState("initial")
                      setTransferAmount("0.00")

                      // Repeat the cycle
                      const cycleTransferAnimation = () => {
                        // Select asset
                        transferTimerRef.current = setTimeout(() => {
                          setTransferState("asset-selected")

                          // Enter amount with typing animation again
                          transferTimerRef.current = setTimeout(() => {
                            setTransferState("amount-entered")

                            // Reset for typing animation
                            currentIndex = 0
                            typeAmount()
                          }, 500)
                        }, 800)
                      }

                      cycleTransferAnimation()
                    }, 1500)
                  }, 1500)
                }, 500)
              }
            }
          }

          // Start typing animation
          typeAmount()
        }, 500)
      }, 800)
    } else {
      // Clear timers when not hovering
      if (transferTimerRef.current) {
        clearTimeout(transferTimerRef.current)
        transferTimerRef.current = null
      }
      setTransferState("initial")
      setTransferAmount("0.00")
    }

    return () => {
      if (transferTimerRef.current) {
        clearTimeout(transferTimerRef.current)
      }
    }
  }, [isTransferHovered])

  // Add glow animation styles
  const glowStyles = `
/* Hide scrollbar for Chrome, Safari and Opera */
::-webkit-scrollbar {
  display: none;
}

/* Hide scrollbar for IE, Edge and Firefox */
* {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

/* Simple Feature Cards (Top Section) */
.simple-feature-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: visible;
  border: none !important;
  transform: translateY(0);
  background: rgba(17, 24, 39, 0.8) !important;
}

.simple-feature-card::before {
  content: '';
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  background-size: 200% 200%;
  -webkit-mask: 
    linear-gradient(#fff 0 0) content-box, 
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.9;
  background-position: 0% 0%;
  transition: all 0.3s ease;
  z-index: 1;
  padding: 2px;
}

/* Desktop hover effect for simple cards */
@media (hover: hover) {
  .simple-feature-card:hover {
    transform: translateY(-4px);
  }
  
  .simple-feature-card:hover::before {
    opacity: 1;
    filter: brightness(1.5);
  }
}

/* Mobile active effect for simple cards */
@media (hover: none) {
  .simple-feature-card:active {
    transform: scale(0.98);
  }
  
  .simple-feature-card:active::before {
    opacity: 1;
    filter: brightness(1.5);
  }
}

/* Color-specific gradient borders for simple cards */
.simple-feature-card-blue::before {
  background: linear-gradient(
    45deg,
    rgba(59, 130, 246, 1) 0%,
    rgba(96, 165, 250, 1) 25%,
    rgba(147, 197, 253, 1) 50%,
    rgba(96, 165, 250, 1) 75%,
    rgba(59, 130, 246, 1) 100%
  );
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.6);
}

.simple-feature-card-purple::before {
  background: linear-gradient(
    45deg,
    rgba(147, 51, 234, 1) 0%,
    rgba(168, 85, 247, 1) 25%,
    rgba(216, 180, 254, 1) 50%,
    rgba(168, 85, 247, 1) 75%,
    rgba(147, 51, 234, 1) 100%
  );
  box-shadow: 0 0 20px rgba(147, 51, 234, 0.6);
}

.simple-feature-card-indigo::before {
  background: linear-gradient(
    45deg,
    rgba(79, 70, 229, 1) 0%,
    rgba(99, 102, 241, 1) 25%,
    rgba(165, 180, 252, 1) 50%,
    rgba(99, 102, 241, 1) 75%,
    rgba(79, 70, 229, 1) 100%
  );
  box-shadow: 0 0 20px rgba(79, 70, 229, 0.6);
}

.simple-feature-card-cyan::before {
  background: linear-gradient(
    45deg,
    rgba(6, 182, 212, 1) 0%,
    rgba(34, 211, 238, 1) 25%,
    rgba(103, 232, 249, 1) 50%,
    rgba(34, 211, 238, 1) 75%,
    rgba(6, 182, 212, 1) 100%
  );
  box-shadow: 0 0 20px rgba(6, 182, 212, 0.6);
}

/* Interactive Feature Cards (Bottom Section) */
.interactive-feature-card {
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  border: none !important;
  background: rgba(31, 41, 55, 0.8) !important;
  transform: translateY(0);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

/* Desktop hover effect for interactive cards */
@media (hover: hover) {
  .interactive-feature-card:hover {
    transform: translateY(-4px);
    background: rgba(17, 24, 39, 0.9) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
  }
}

/* Mobile scroll-based effect for interactive cards */
@media (hover: none) {
  .interactive-feature-card.in-view {
    transform: translateY(-4px);
    background: rgba(17, 24, 39, 0.9) !important;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3);
    transition: all 0.3s ease;
  }
  
  .interactive-feature-card.in-view::after {
    opacity: 1;
    transition: opacity 0.3s ease;
  }
  
  .interactive-feature-card:active {
    transform: scale(0.98);
  }

  .simple-feature-card.in-view {
    transform: translateY(-4px);
    transition: all 0.3s ease;
  }
  
  .simple-feature-card.in-view::before {
    opacity: 1;
    filter: brightness(1.5);
    transition: all 0.3s ease;
  }
  
  .simple-feature-card:active {
    transform: scale(0.98);
  }
}

/* Color-specific borders for interactive cards */
.interactive-feature-card-blue {
  border-left: 8px solid rgba(59, 130, 246, 0.9) !important;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
}

.interactive-feature-card-purple {
  border-right: 8px solid rgba(147, 51, 234, 0.9) !important;
  box-shadow: 0 4px 12px rgba(147, 51, 234, 0.2);
}

.interactive-feature-card-indigo {
  border-left: 8px solid rgba(79, 70, 229, 0.9) !important;
  box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
}

.interactive-feature-card-cyan {
  border-right: 8px solid rgba(6, 182, 212, 0.9) !important;
  box-shadow: 0 4px 12px rgba(6, 182, 212, 0.2);
}

/* Add subtle hover indicators */
.interactive-feature-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.1),
    rgba(255, 255, 255, 0)
  );
  opacity: 0;
  transition: opacity 0.3s ease;
  pointer-events: none;
}

@media (hover: hover) {
  .interactive-feature-card:hover::after {
    opacity: 1;
  }
}

@media (hover: none) {
  .interactive-feature-card.in-view::after {
    opacity: 1;
  }
  
  .interactive-feature-card:active::after {
    opacity: 1;
  }
}

/* Color-specific hover effects */
.interactive-feature-card-blue::after {
  background: linear-gradient(
    to bottom,
    rgba(59, 130, 246, 0.15),
    rgba(59, 130, 246, 0)
  );
}

.interactive-feature-card-purple::after {
  background: linear-gradient(
    to bottom,
    rgba(147, 51, 234, 0.15),
    rgba(147, 51, 234, 0)
  );
}

.interactive-feature-card-indigo::after {
  background: linear-gradient(
    to bottom,
    rgba(79, 70, 229, 0.15),
    rgba(79, 70, 229, 0)
  );
}

.interactive-feature-card-cyan::after {
  background: linear-gradient(
    to bottom,
    rgba(6, 182, 212, 0.15),
    rgba(6, 182, 212, 0)
  );
}

/* Remove the glow classes since we're not using them anymore */
.glow-blue, .glow-purple, .glow-indigo, .glow-cyan {
  box-shadow: none;
  animation: none;
}

.glow-button {
  box-shadow: 0 0 15px 2px rgba(147, 51, 234, 0.4);
  transition: box-shadow 0.3s ease;
  background: linear-gradient(90deg, 
    #3b82f6,
    #a855f7
  );
}

.glow-button:hover {
  box-shadow: 0 0 20px 5px rgba(147, 51, 234, 0.6);
}

.glow-card {
  transition: box-shadow 0.3s ease;
}

.glow-card:hover {
  box-shadow: 0 0 20px 5px rgba(255, 255, 255, 0.15);
}

.text-glow-blue {
  text-shadow: 0 0 5px rgba(59, 130, 246, 0.5), 0 0 10px rgba(59, 130, 246, 0.3);
}

.text-glow-purple {
  text-shadow: 0 0 5px rgba(147, 51, 234, 0.5), 0 0 10px rgba(147, 51, 234, 0.3);
}

.text-glow-indigo {
  text-shadow: 0 0 5px rgba(79, 70, 229, 0.5), 0 0 10px rgba(79, 70, 229, 0.3);
}

.text-glow-cyan {
  text-shadow: 0 0 5px rgba(6, 182, 212, 0.5), 0 0 10px rgba(6, 182, 212, 0.3);
}

.text-glow-white {
  text-shadow: 0 0 3px rgba(255, 255, 255, 0.5), 0 0 15px rgba(255, 255, 255, 0.3);
}

.metallic-blue {
  background: linear-gradient(to bottom, #60a5fa, #93c5fd, #60a5fa);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.3), 0 0 5px rgba(59, 130, 246, 0.4);
  animation: shift-metallic 8s linear infinite;
}

.metallic-purple {
  background: linear-gradient(to bottom, #a855f7, #d8b4fe, #a855f7);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.3), 0 0 5px rgba(147, 51, 234, 0.4);
  animation: shift-metallic 8s linear infinite;
}

.metallic-indigo {
  background: linear-gradient(to bottom, #6366f1, #a5b4fc, #6366f1);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.3), 0 0 5px rgba(79, 70, 229, 0.4);
  animation: shift-metallic 8s linear infinite;
}

.metallic-cyan {
  background: linear-gradient(to bottom, #06b6d4, #67e8f9, #06b6d4);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.3), 0 0 5px rgba(6, 182, 212, 0.4);
  animation: shift-metallic 8s linear infinite;
}

.metallic-white {
  background: linear-gradient(to bottom, #d1d5db, #f9fafb, #d1d5db);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2), 0 0 5px rgba(255, 255, 255, 0.3);
  animation: shift-metallic 8s linear infinite;
  padding-bottom: 0.1em;
  line-height: 1.2;
}

.hero-metallic-white {
  background: linear-gradient(to bottom, #d1d5db, #f9fafb, #d1d5db);
  background-size: 100% 200%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  text-shadow: 0px 2px 3px rgba(0, 0, 0, 0.2), 0 0 5px rgba(255, 255, 255, 0.3);
  animation: shift-metallic 8s linear infinite;
  padding-bottom: 0.1em;
  line-height: 1.2;
}

.animated-gradient {
  background-size: 200% 200%;
  animation: shift-gradient 5s ease infinite;
}

/* Animation classes */
.animate-fade-in {
  animation: fadeIn 0.5s ease-out forwards;
}

.animate-fade-up {
  animation: fadeUp 0.5s ease-out forwards;
}

.animate-slide-left {
  animation: slideLeft 0.5s ease-out forwards;
}

.animate-slide-right {
  animation: slideRight 0.5s ease-out forwards;
}

.animate-zoom-in {
  animation: zoomIn 0.5s ease-out forwards;
}

.animate-glow-pulse {
  animation: glowPulse 2s ease-in-out infinite;
}

/* Animation keyframes */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideLeft {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes slideRight {
  from {
    opacity: 0;
    transform: translateX(20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes zoomIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes glowPulse {
  0%, 100% {
    box-shadow: 0 0 15px 2px rgba(147, 51, 234, 0.4);
  }
  50% {
    box-shadow: 0 0 25px 5px rgba(147, 51, 234, 0.6);
  }
  100% {
    box-shadow: 0 0 15px 2px rgba(147, 51, 234, 0.4);
  }
}

@keyframes rotate-gradient {
  from { transform: translateX(0); }
  to { transform: translateX(-100%); }
}

/* Contact list auto-scroll animation */
@keyframes contactScroll {
  0%, 20% {
    transform: translateY(0);
  }
  25%, 45% {
    transform: translateY(-60px);
  }
  50%, 70% {
    transform: translateY(-120px);
  }
  75%, 95% {
    transform: translateY(-60px);
  }
  100% {
    transform: translateY(0);
  }
}

.contacts-auto-scroll {
  animation: contactScroll 8s infinite ease-in-out;
}

/* QR code scanning animation */
@keyframes scan {
  0% { top: 0; }
  50% { top: calc(100% - 4px); }
  100% { top: 0; }
}

.mock-scan-line {
  position: absolute;
  animation: scan 2s ease-in-out infinite;
}

/* Transfer button highlight animation */
@keyframes buttonHighlight {
  0% { background-color: rgba(79, 70, 229, 0.6); }
  50% { background-color: rgba(79, 70, 229, 1); }
  100% { background-color: rgba(79, 70, 229, 0.6); }
}

.button-highlight {
  animation: buttonHighlight 1s infinite;
}

/* Success animation */
@keyframes successPulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

.success-pulse {
  animation: successPulse 1s infinite;
}

@keyframes scrollContacts {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(calc(-100% + 210px));
  }
}

.animate-scrollContacts {
  animation: scrollContacts 5s linear infinite;
}

@keyframes rotateGlow {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

@keyframes infiniteScroll {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(calc(-100% + 210px));
  }
}

.animate-infiniteScroll {
  animation: infiniteScroll 20s linear infinite;
}

.rotate-glow-hover {
  position: relative;
  overflow: hidden;
}

.rotate-glow-hover::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(0deg);
  transition: transform 0.5s ease;
  pointer-events: none;
}

.rotate-glow-hover:hover::before {
  animation: rotateGlow 4s linear infinite;
}
`

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passkeyName.trim()) {
      // Use URL parameters instead of localStorage
      router.push(`/auth?passkeyName=${encodeURIComponent(passkeyName.trim())}`)
    }
  }

  // Extended contact list for scrolling animation
  const contactList = [
    { name: "Alex Smith", lastUsed: "Just now", address: "G...5X3Q" },
    { name: "Jamie Wilson", lastUsed: "5 minutes ago", address: "H...9P7R" },
    { name: "Taylor Lee", lastUsed: "30 minutes ago", address: "K...2M8T" },
    { name: "Morgan Davis", lastUsed: "1 hour ago", address: "L...7F3P" },
    { name: "Casey Brown", lastUsed: "3 hours ago", address: "M...9T2R" },
    { name: "Jordan Quinn", lastUsed: "5 hours ago", address: "N...8K4L" },
    { name: "Riley Parker", lastUsed: "Yesterday", address: "P...3J7M" },
    { name: "Avery Johnson", lastUsed: "2 days ago", address: "Q...6H2N" },
    { name: "Cameron White", lastUsed: "4 days ago", address: "R...1G9P" },
    { name: "Dakota Green", lastUsed: "1 week ago", address: "S...5F3Q" },
    { name: "Emerson Black", lastUsed: "2 weeks ago", address: "T...7D1R" },
    { name: "Finley Gray", lastUsed: "3 weeks ago", address: "U...2C8S" },
    { name: "Harper Blue", lastUsed: "1 month ago", address: "V...9B4T" },
    { name: "Indigo Teal", lastUsed: "2 months ago", address: "W...3A7U" },
    { name: "Jordan Crimson", lastUsed: "3 months ago", address: "X...6Z2V" },
  ]

  let keyId: string;
  let contractId: string;
  let balance: string = '0';

  async function getWalletSigners() {
    try {
      const response = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_wallet_by_contract_id',
          contractId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get wallet signers');
      }

      const data = await response.json();
      console.log('Wallet signers:', data);
    } catch (err) {
      console.error('Error getting signers:', err);
    }
  }

  async function connect(keyId_?: string) {
    try {
      const { keyId: kid, contractId: cid } = await account.connectWallet(
        {
          keyId: keyId_,
          getContractId: (keyId: string) => server.getContractId({ keyId }),
        },
      );

      keyId = base64url(kid);
      localStorage.setItem("sp:keyId", keyId);

      contractId = cid;
      console.log("connect", cid);

      // Get wallet data and signers
      await getWalletSigners();
    } catch (err: any) {
      console.error(err);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white relative">
      <style jsx global>
        {glowStyles}
      </style>

      {/* Fixed background gradient that stays still when scrolling */}
      <div className="fixed inset-0 bg-gradient-to-b from-blue-900/5 via-purple-900/5 to-indigo-900/5 pointer-events-none z-0"></div>

      <header
        className={`sticky top-0 z-50 border-b border-gray-800 backdrop-blur supports-[backdrop-filter]:bg-black/20 transition-all duration-300 ${hasScrolled ? "bg-black/70" : "bg-black/50"}`}
      >
        <div className="container px-4 md:px-6 mx-auto max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="text-xl font-bold">StellarEase</span>
          </div>
          <nav className="flex items-center">
            <Button asChild size="sm" className="border-0 glow-button">
              <Link href="/auth">Get Started</Link>
            </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1 relative z-10">
        {/* Hero section with colored stripes */}
        <section className="relative min-h-[600px] flex items-center">
          {/* Blue stripe - with parallax effect */}
          <div className="absolute top-0 left-0 w-full h-[150px] bg-gradient-to-b from-blue-600 to-blue-500 z-0"></div>

          {/* Purple stripe */}
          <div className="absolute top-[150px] left-0 w-full h-[150px] bg-gradient-to-b from-purple-500 to-purple-600 z-0"></div>

          {/* Indigo stripe */}
          <div className="absolute top-[300px] left-0 w-full h-[150px] bg-gradient-to-b from-indigo-500 to-indigo-600 z-0"></div>

          {/* Cyan stripe */}
          <div className="absolute top-[450px] left-0 w-full h-[150px] bg-gradient-to-b from-cyan-500 to-cyan-600 z-0"></div>

          {/* Content */}
          <div className="relative z-10 container px-4 md:px-6 mx-auto">
            <div className="mx-auto max-w-[800px] flex flex-col items-center gap-8 text-center">
              <h1
                ref={titleAnimation.ref}
                className={`text-4xl font-bold leading-tight tracking-tighter md:text-5xl lg:text-6xl text-white text-glow-white ${titleAnimation.animationClass}`}
              >
                Web3 that feels like Web2
              </h1>
              <form
                ref={formAnimation.ref}
                onSubmit={handleSubmit}
                className={`relative w-full max-w-md ${formAnimation.animationClass}`}
              >
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Choose Passkey Name"
                    value={passkeyName}
                    onChange={(e) => setPasskeyName(e.target.value)}
                    className="flex h-14 w-full rounded-xl border-2 border-white/10 bg-black/40 backdrop-blur-sm pl-6 pr-14 py-2 text-white placeholder:text-white/50 shadow-[0_0_15px_rgba(255,255,255,0.1)] focus:border-white/30 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 backdrop-blur-sm transition-all duration-300"
                  >
                    <ArrowRight className="h-5 w-5 text-white" />
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </section>

        <section className="py-20 relative z-10">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="mx-auto max-w-3xl">
              <div>
                <h2
                  ref={headingAnimation.ref}
                  className={`text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl metallic-white text-center mb-8 ${headingAnimation.animationClass}`}
                >
                  Blockchain Made Simple
                </h2>
                <p
                  ref={descriptionAnimation.ref}
                  className={`text-gray-300 text-center max-w-2xl mx-auto mb-12 text-lg ${descriptionAnimation.animationClass}`}
                >
                  Access your digital assets from any device with a web browser—phone, tablet, laptop, desktop, even
                  your smart refrigerator or Nintendo Switch. Unlike traditional finance apps or other cryptocurrency
                  wallets, StellarEase requires no downloads or installations. Just set up a passkey once and you're
                  instantly ready—no lengthy KYC processes, no seed phrases to write down, no complex setup steps like
                  other platforms require. It's simply a website where you truly own and control your assets without
                  banks, governments, or middlemen, with seamless, sovereign access anywhere, anytime.
                </p>
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Card with blue outline and large blue circle with white icon */}
                  <div
                    ref={card1Animation.ref}
                    className={`rounded-lg bg-gray-900/80 p-6 border-4 border-blue-600 simple-feature-card simple-feature-card-blue ${card1Animation.animationClass}`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center">
                        <Fingerprint className="h-14 w-14 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium metallic-blue text-xl mb-2">Passkey Authentication</h3>
                        <p className="text-gray-300">
                          Use your device's biometrics (fingerprint, face ID) for secure login. No passwords to remember
                          or reset.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card with purple outline and large purple circle with white icon */}
                  <div
                    ref={card2Animation.ref}
                    className={`rounded-lg bg-gray-900/80 p-6 border-4 border-purple-600 simple-feature-card simple-feature-card-purple ${card2Animation.animationClass}`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center">
                        <Laptop className="h-14 w-14 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium metallic-purple text-xl mb-2">Multi-Device Access</h3>
                        <p className="text-gray-300">
                          Access your wallet from any device with your passkey. No downloads, installations, or
                          complicated recovery processes needed.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card with indigo outline and large indigo circle with white icon */}
                  <div
                    ref={card3Animation.ref}
                    className={`rounded-lg bg-gray-900/80 p-6 border-4 border-indigo-600 simple-feature-card simple-feature-card-indigo ${card3Animation.animationClass}`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center">
                        <Shield className="h-14 w-14 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium metallic-indigo text-xl mb-2">No Gas Fees</h3>
                        <p className="text-gray-300">
                          Transactions are processed without requiring you to pay gas fees. Just click and confirm.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card with cyan outline and large cyan circle with white icon */}
                  <div
                    ref={card4Animation.ref}
                    className={`rounded-lg bg-gray-900/80 p-6 border-4 border-cyan-600 simple-feature-card simple-feature-card-cyan ${card4Animation.animationClass}`}
                  >
                    <div className="flex flex-col items-center text-center gap-4">
                      <div className="h-24 w-24 rounded-full bg-cyan-600 flex items-center justify-center">
                        <Zap className="h-14 w-14 text-white" />
                      </div>
                      <div>
                        <h3 className="font-medium metallic-cyan text-xl mb-2">Instant Transactions</h3>
                        <p className="text-gray-300">
                          Experience lightning-fast transactions on the Stellar network without the technical
                          complexity.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* New section: Familiar Banking Experience */}
        <section className="py-20 bg-gray-900/50 relative z-10">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div className="mx-auto max-w-4xl">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl metallic-white text-center mb-12">
                Feels Just Like Your Banking App
              </h2>
              <p className="text-gray-300 text-center max-w-2xl mx-auto mb-12 text-lg">
                We've taken the best parts of regular banking apps and made them work with blockchain. No weird terms,
                no confusing steps—just the simple experience you're used to.
              </p>

              {/* New Card: No Seed Phrases */}
              <div
                ref={seedPhraseAnimation.ref}
                className={`bg-gray-800/50 rounded-lg p-6 md:p-8 border-2 border-dashed border-red-600 relative overflow-hidden mb-12 ${seedPhraseAnimation.animationClass}`}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-red-600/5"></div>
                <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                  <div className="w-full md:w-1/2">
                    <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg p-4 h-full">
                      <div className="bg-gray-800 rounded-lg p-5 pointer-events-none h-full">
                        <div className="text-center mb-4">
                          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-600 mb-4">
                            <X className="h-10 w-10 text-white" />
                          </div>
                          <h4 className="text-white text-lg font-medium">No Seed Phrases</h4>
                        </div>
                        <div className="relative">
                          <div className="bg-gray-700 rounded-lg p-3 text-gray-400 text-sm opacity-30">
                            <div className="flex flex-wrap gap-2 justify-center">
                              {Array.from({ length: 24 }).map((_, i) => (
                                <div key={i} className="bg-gray-600 px-3 py-1 rounded text-xs">
                                  word {i + 1}
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Overlay indicating seed phrases aren't used */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <div className="bg-red-600/90 rounded-md px-4 py-2 shadow-lg">
                              <p className="text-white font-bold text-sm">NOT REQUIRED</p>
                            </div>
                            <div className="mt-2 bg-gray-900/80 rounded-md px-3 py-1 shadow-lg">
                              <p className="text-gray-200 text-xs">Passkeys replace seed phrases</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <h3 className="font-medium text-white text-2xl mb-4 flex items-center justify-end">
                      No Complicated Seed Phrases
                      <span className="inline-block w-3 h-10 bg-red-600 ml-3"></span>
                    </h3>
                    <p className="text-gray-300 text-lg mb-4">
                      Traditional crypto wallets force you to write down and safeguard 12 or 24 random words. Lose them,
                      and you lose everything. We've eliminated this complexity entirely.
                    </p>
                    <ul className="text-gray-300 space-y-2">
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        No seed phrases to write down and store
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        No risk of losing access if you misplace a piece of paper
                      </li>
                      <li className="flex items-start">
                        <span className="text-red-400 mr-2">•</span>
                        Just use your device's biometrics—the same way you unlock your phone
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="space-y-16">
                {/* Feature 1: Address Book - BLUE */}
                <div
                  ref={feature1Animation.ref}
                  className={`interactive-feature-card interactive-feature-card-blue glow-blue bg-gray-800/50 rounded-lg p-6 md:p-8 border-l-8 border-blue-600 relative overflow-hidden ${feature1Animation.animationClass}`}
                  onMouseEnter={() => setIsContactsHovered(true)}
                  onMouseLeave={() => setIsContactsHovered(false)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600 transform rotate-45 translate-x-8 -translate-y-8 opacity-20"></div>
                  <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="w-full md:w-1/2 order-2 md:order-1">
                      <h3 className="font-medium metallic-blue text-2xl mb-4 flex items-center">
                        <span className="inline-block w-3 h-10 bg-blue-600 mr-3"></span>
                        Contact List
                      </h3>
                      <p className="text-gray-300 text-lg mb-4">
                        Save your friends and family in an address book. No need to remember long crypto addresses—just
                        pick a name from your contacts, just like in your banking app.
                      </p>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Add contacts with a name and address
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Scan QR codes to add new contacts instantly
                        </li>
                        <li className="flex items-start">
                          <span className="text-blue-400 mr-2">•</span>
                          Send money with just a few taps
                        </li>
                      </ul>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2">
                      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg p-4 h-full">
                        <div className="bg-gray-800 rounded-lg p-5 pointer-events-none h-full">
                          <div className="flex justify-between items-center mb-4">
                            <h4 className="text-white text-lg font-medium">Contacts</h4>
                            <div className="text-blue-400 text-sm flex items-center">
                              <User className="h-4 w-4 mr-1" />
                              Add New
                            </div>
                          </div>
                          <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <div className="w-full bg-gray-700 border border-transparent rounded-md pl-10 pr-4 py-2 text-sm text-gray-400">
                              Search contacts...
                            </div>
                          </div>

                          <div className="space-y-3 overflow-hidden h-[210px] relative">
                            <div
                              className={`space-y-3 ${isContactsHovered ? "animate-infiniteScroll" : ""}`}
                              style={{
                                paddingBottom: "210px", // Add padding equal to container height for seamless loop
                              }}
                            >
                              {/* First set of contacts */}
                              {contactList.map((contact, index) => (
                                <div
                                  key={`first-${index}`}
                                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                                >
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                                      {contact.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-white font-medium">{contact.name}</div>
                                      <div className="text-gray-400 text-sm flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {contact.lastUsed}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-gray-400 text-sm">{contact.address}</div>
                                </div>
                              ))}

                              {/* Duplicate set for seamless looping */}
                              {contactList.slice(0, 5).map((contact, index) => (
                                <div
                                  key={`duplicate-${index}`}
                                  className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg"
                                >
                                  <div className="flex items-center">
                                    <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                                      {contact.name
                                        .split(" ")
                                        .map((n) => n[0])
                                        .join("")}
                                    </div>
                                    <div className="ml-3">
                                      <div className="text-white font-medium">{contact.name}</div>
                                      <div className="text-gray-400 text-sm flex items-center">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {contact.lastUsed}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="text-gray-400 text-sm">{contact.address}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 2: QR Code - PURPLE */}
                <div
                  ref={feature2Animation.ref}
                  className={`interactive-feature-card interactive-feature-card-purple glow-purple bg-gray-800/50 rounded-lg p-6 md:p-8 border-r-8 border-purple-600 relative overflow-hidden ${feature2Animation.animationClass}`}
                  onMouseEnter={() => setIsQrHovered(true)}
                  onMouseLeave={() => setIsQrHovered(false)}
                >
                  <div className="absolute top-0 left-0 w-24 h-24 bg-purple-600 transform rotate-45 -translate-x-8 -translate-y-8 opacity-20"></div>
                  <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="w-full md:w-1/2">
                      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg p-4 h-full">
                        <div className="bg-gray-800 rounded-lg p-5 pointer-events-none h-full">
                          <div className="text-center mb-4">
                            <h4 className="text-white text-lg font-medium">Scan QR Code</h4>
                            <p className="text-gray-400 text-sm">Point your camera at a QR code</p>
                          </div>
                          <div className="relative mb-4 flex justify-center">
                            <div className="aspect-square w-full max-w-[220px] mx-auto bg-gray-900 rounded-lg flex items-center justify-center mb-4 border-2 border-dashed border-purple-500 overflow-hidden">
                              {qrScanState === "scanning" ? (
                                <div className="w-3/4 h-3/4 relative">
                                  {/* QR Code Frame */}
                                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-400"></div>
                                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-400"></div>
                                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-400"></div>
                                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-400"></div>

                                  {/* Scanning animation */}
                                  <div
                                    className="absolute left-0 w-full h-1 bg-purple-500"
                                    style={{
                                      animation: "scan 2s ease-in-out infinite",
                                      top: "0",
                                      position: "absolute",
                                    }}
                                  ></div>
                                </div>
                              ) : (
                                <div className="h-16 w-16 rounded-full bg-green-600 flex items-center justify-center success-pulse">
                                  <Check className="h-8 w-8 text-white" />
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="bg-gray-700/50 rounded-lg p-4">
                            {qrScanState === "scanning" ? (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-gray-600/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-400" />
                                  </div>
                                  <div>
                                    <div className="text-gray-400 text-sm">Scanning...</div>
                                    <div className="text-gray-500 text-xs">Waiting for QR code</div>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="h-8 w-8 rounded-full bg-purple-600/20 flex items-center justify-center">
                                    <User className="h-4 w-4 text-purple-400" />
                                  </div>
                                  <div>
                                    <div className="text-white font-medium text-sm">Chris</div>
                                    <div className="text-gray-400 text-xs">G...7Y2Z</div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button className="bg-gray-600/50 hover:bg-gray-600 rounded-lg py-1.5 px-3 text-xs text-gray-300 transition-colors">
                                    Cancel
                                  </button>
                                  <button className="bg-purple-600 hover:bg-purple-500 rounded-lg py-1.5 px-3 text-xs text-white transition-colors">
                                    Add
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2">
                      <h3 className="font-medium metallic-purple text-2xl mb-4 flex items-center justify-end">
                        QR Code Payments
                        <span className="inline-block w-3 h-10 bg-purple-600 ml-3"></span>
                      </h3>
                      <p className="text-gray-300 text-lg mb-4">
                        Send money by scanning a QR code, just like you would with Venmo or Cash App. No copying and
                        pasting required.
                      </p>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          Scan to pay anyone instantly
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          Share your QR code to receive payments
                        </li>
                        <li className="flex items-start">
                          <span className="text-purple-400 mr-2">•</span>
                          No need to type long addresses
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Feature 3: Simple Sending - INDIGO */}
                <div
                  ref={feature3Animation.ref}
                  className={`interactive-feature-card interactive-feature-card-indigo glow-indigo bg-gray-800/50 rounded-lg p-6 md:p-8 border-l-8 border-indigo-600 relative overflow-hidden ${feature3Animation.animationClass}`}
                  onMouseEnter={() => setIsTransferHovered(true)}
                  onMouseLeave={() => setIsTransferHovered(false)}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-600 transform rotate-45 translate-x-8 -translate-y-8 opacity-20"></div>
                  <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="w-full md:w-1/2 order-2 md:order-1">
                      <h3 className="font-medium metallic-indigo text-2xl mb-4 flex items-center">
                        <span className="inline-block w-3 h-10 bg-indigo-600 mr-3"></span>
                        Easy Transfers
                      </h3>
                      <p className="text-gray-300 text-lg mb-4">
                        Send money in just a few taps. Choose a contact, enter an amount, and confirm—that's it. No
                        complicated steps or technical knowledge needed.
                      </p>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          Simple, familiar transfer process
                        </li>
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          No gas fees or network settings to worry about
                        </li>
                        <li className="flex items-start">
                          <span className="text-indigo-400 mr-2">•</span>
                          Instant confirmation when your transfer is complete
                        </li>
                      </ul>
                    </div>
                    <div className="w-full md:w-1/2 order-1 md:order-2">
                      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg p-4 h-full">
                        {/* Send Money UI Mockup - Based on the screenshot */}
                        <div className="bg-gray-800 rounded-lg p-5 pointer-events-none h-full">
                          <div className="flex items-center mb-6 bg-gray-700/50 rounded-lg p-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium">
                              AJ
                            </div>
                            <div className="ml-3 flex-1">
                              <div className="text-white font-medium">Alice Johnson</div>
                              <div className="text-gray-400 text-sm">GDPWK3...QT4ZQP</div>
                              <div className="text-gray-400 text-sm">Last used: May 2, 2025</div>
                            </div>
                          </div>

                          <div className="mb-6">
                            <div className="text-gray-400 text-sm mb-2">Amount</div>
                            <div className="bg-gray-700 rounded-lg p-3 flex justify-between items-center">
                              <div className="text-white text-base min-h-[24px] flex items-center">
                                {transferState === "initial" || transferState === "asset-selected"
                                  ? ""
                                  : transferAmount}
                                {transferState === "amount-entered" && (
                                  <span className="inline-block w-[2px] h-[18px] bg-white ml-[1px] animate-pulse"></span>
                                )}
                              </div>
                              <div className="text-gray-400 text-sm">XLM</div>
                            </div>
                            <div className="text-gray-400 text-xs mt-1">Available: 250 XLM</div>
                          </div>

                          <div className="mb-6">
                            <div className="text-gray-400 text-sm mb-2">Message (Optional)</div>
                            <div className="bg-gray-700 rounded-lg p-3 text-gray-400 text-sm min-h-[60px]">
                              Add a note about this transaction...
                            </div>
                          </div>

                          <div className="flex justify-between gap-4">
                            <div className="bg-gray-700 rounded-lg py-1.5 px-3 text-white text-sm text-center w-24">
                              Back
                            </div>
                            {transferState === "complete" ? (
                              <div className="bg-green-600 rounded-lg py-1.5 px-3 text-white text-sm text-center w-24 success-pulse">
                                <Check className="h-4 w-4 inline mr-1" />
                                Sent!
                              </div>
                            ) : transferState === "sending" ? (
                              <div className="bg-indigo-600/70 rounded-lg py-1.5 px-3 text-white text-sm text-center w-24">
                                Sending...
                              </div>
                            ) : (
                              <div
                                className={`bg-indigo-600 rounded-lg py-1.5 px-3 text-white text-sm text-center w-24 ${transferState === "amount-entered" ? "button-highlight" : ""}`}
                              >
                                Send
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Feature 4: Security - CYAN */}
                <div
                  ref={feature4Animation.ref}
                  className={`interactive-feature-card interactive-feature-card-cyan glow-cyan bg-gray-800/50 rounded-lg p-6 md:p-8 border-r-8 border-cyan-600 relative overflow-hidden ${feature4Animation.animationClass}`}
                >
                  <div className="absolute top-0 left-0 w-24 h-24 bg-cyan-600 transform rotate-45 -translate-x-8 -translate-y-8 opacity-20"></div>
                  <div className="flex flex-col md:flex-row gap-8 items-center relative z-10">
                    <div className="w-full md:w-1/2">
                      <div className="bg-gray-900 rounded-lg overflow-hidden border border-gray-700 shadow-lg p-4 h-full">
                        {/* Zero Data Storage UI Mockup */}
                        <div className="bg-gray-800 rounded-lg p-5 pointer-events-none h-full">
                          <div className="text-center mb-6">
                            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-cyan-600 mb-4">
                              <Database className="h-8 w-8 text-white" />
                            </div>
                            <h4 className="text-white text-lg font-medium">Zero Server Storage</h4>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-start">
                              <div className="mt-1 mr-3 h-6 w-6 min-w-[1.5rem] rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <X className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium">No Stored Passwords</div>
                                <div className="text-gray-400 text-sm">
                                  We don't store any passwords that could be leaked
                                </div>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <div className="mt-1 mr-3 h-6 w-6 min-w-[1.5rem] rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <X className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium">No Private Keys on Servers</div>
                                <div className="text-gray-400 text-sm">Your keys never leave your device</div>
                              </div>
                            </div>

                            <div className="flex items-start">
                              <div className="mt-1 mr-3 h-6 w-6 min-w-[1.5rem] rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                                <X className="h-4 w-4 text-white" />
                              </div>
                              <div>
                                <div className="text-white font-medium">No Personal Information</div>
                                <div className="text-gray-400 text-sm">
                                  We don't collect or store your personal data
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="w-full md:w-1/2">
                      <h3 className="font-medium metallic-cyan text-2xl mb-4 flex items-center justify-end">
                        Nothing to Hack
                        <span className="inline-block w-3 h-10 bg-cyan-600 ml-3"></span>
                      </h3>
                      <p className="text-gray-300 text-lg mb-4">
                        Unlike traditional websites and banking apps, StellarEase doesn't store your data on servers.
                        There's simply nothing for hackers to steal.
                      </p>
                      <ul className="text-gray-300 space-y-2">
                        <li className="flex items-start">
                          <span className="text-cyan-400 mr-2">•</span>
                          Your assets are secured by blockchain technology, not stored on our servers
                        </li>
                        <li className="flex items-start">
                          <span className="text-cyan-400 mr-2">•</span>
                          No central database means no single point of failure
                        </li>
                        <li className="flex items-start">
                          <span className="text-cyan-400 mr-2">•</span>
                          Even if our website goes down, your assets remain safe and accessible
                        </li>
                        <li className="flex items-start">
                          <span className="text-cyan-400 mr-2">•</span>
                          Your device's security is the only thing protecting your assets—just like it should be
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-16 bg-gray-800/30 rounded-lg p-6 border-l-4 border-blue-500">
                <p className="text-gray-200 text-lg">
                  "We built this for people who just want their money to work without having to learn a bunch of new
                  terms. If you've used a banking app before, you already know how to use StellarEase."
                </p>
                <p className="mt-4 text-gray-400">— The StellarEase Team</p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 relative z-10">
          <div className="container px-4 md:px-6 mx-auto max-w-7xl">
            <div ref={ctaAnimation.ref} className={`mx-auto max-w-[800px] text-center ${ctaAnimation.animationClass}`}>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl metallic-white">
                Ready to get started?
              </h2>
              <p className="mt-4 text-gray-400 md:text-lg">
                Join thousands of users who are already enjoying the benefits of blockchain without the complexity.
              </p>
              <div className="mt-8">
                <Button size="lg" className="px-8 border-0 glow-button" asChild>
                  <Link href="/auth">Create Your Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="border-t border-gray-800 relative z-10">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 py-8 md:h-20 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="font-semibold text-white">StellarEase</span>
          </div>
          <p className="text-sm text-gray-500">&copy; 2025 StellarEase. All rights reserved.</p>
        </div>
      </footer>

      {/* Scroll Progress Indicator at the bottom */}
      <div className="fixed bottom-0 left-0 w-full h-1 z-50 bg-gray-800">
        <div
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-150 ease-out"
          style={{ 
            width: '100%',
            transform: `translateX(${scrollProgress - 100}%)`
          }}
        ></div>
      </div>
    </div>
  )
}
