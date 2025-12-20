"use client"

import { useEffect, useRef } from "react"
import type React from "react"
import { useInView } from "motion/react"
import { annotate } from "rough-notation"
import { type RoughAnnotation } from "rough-notation/lib/model"

type AnnotationAction =
  | "highlight"
  | "underline"
  | "box"
  | "circle"
  | "strike-through"
  | "crossed-off"
  | "bracket"

interface HighlighterProps {
  children: React.ReactNode
  action?: AnnotationAction
  color?: string
  textColor?: string
  strokeWidth?: number
  animationDuration?: number
  iterations?: number
  padding?: number
  multiline?: boolean
  isView?: boolean
}

export function Highlighter({
  children,
  action = "highlight",
  color = "#ffd1dc",
  textColor,
  strokeWidth = 1.5,
  animationDuration = 600,
  iterations = 2,
  padding = 2,
  multiline = true,
  isView = false,
}: HighlighterProps) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const annotationRef = useRef<RoughAnnotation | null>(null)

  const isInView = useInView(elementRef, {
    once: true,
    margin: "-10%",
  })

  // If isView is false, always show. If isView is true, wait for inView
  const shouldShow = !isView || isInView

  useEffect(() => {
    if (!shouldShow) return

    const element = elementRef.current
    if (!element) return

    // Wait for layout to stabilize before creating annotation
    // This prevents flickering when parent elements are animating
    const initTimeout = setTimeout(() => {
      if (!elementRef.current || !elementRef.current.isConnected) return

      const annotationConfig = {
        type: action,
        color,
        strokeWidth,
        animationDuration: 0, // Disable animation to prevent layout shifts
        iterations: 1, // Single iteration
        padding,
        multiline,
      }

      const annotation = annotate(elementRef.current, annotationConfig)

      annotationRef.current = annotation
      // Show immediately without animation
      annotationRef.current.show()
    }, 2000) // Wait 2 seconds for all parent animations (DecoratedText takes 1.5s) to complete

    return () => {
      clearTimeout(initTimeout)
      // Clean up annotation if component unmounts
      if (annotationRef.current) {
        try {
          annotationRef.current.remove()
          annotationRef.current = null
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    }
  }, [
    shouldShow,
    action,
    color,
    strokeWidth,
    animationDuration,
    iterations,
    padding,
    multiline,
  ])

  // Separate effect for resize observer - setup after annotation is created
  useEffect(() => {
    if (!shouldShow) return

    const element = elementRef.current
    if (!element) return

    // Wait for annotation to be created before setting up resize observer
    const setupResizeObserver = () => {
      if (!annotationRef.current) {
        // Check again after a short delay
        setTimeout(setupResizeObserver, 100)
        return
      }

      // Debounce resize handler to prevent flickering
      let resizeTimeout: NodeJS.Timeout
      let lastWidth = element.offsetWidth
      let lastHeight = element.offsetHeight
      
      const resizeObserver = new ResizeObserver((entries) => {
        // Clear previous timeout
        clearTimeout(resizeTimeout)
        
        // Check if size actually changed significantly
        const entry = entries[0]
        if (!entry) return
        
        const { width, height } = entry.contentRect
        const widthChanged = Math.abs(width - lastWidth) > 1
        const heightChanged = Math.abs(height - lastHeight) > 1
        
        // Only update if size changed significantly
        if (!widthChanged && !heightChanged) return
        
        lastWidth = width
        lastHeight = height
        
        // Debounce the resize update
        resizeTimeout = setTimeout(() => {
          // Only update if annotation exists and element is still in DOM
          if (annotationRef.current && elementRef.current && elementRef.current.isConnected) {
            // Use requestAnimationFrame to batch DOM updates and prevent flickering
            requestAnimationFrame(() => {
              if (annotationRef.current && elementRef.current) {
                // Hide and show in the same frame to minimize visual flicker
                annotationRef.current.hide()
                requestAnimationFrame(() => {
                  if (annotationRef.current && elementRef.current) {
                    annotationRef.current.show()
                  }
                })
              }
            })
          }
        }, 150) // 150ms debounce to reduce frequency
      })

      // Only observe the element itself, not document.body
      resizeObserver.observe(element)

      // Store cleanup function
      return () => {
        clearTimeout(resizeTimeout)
        resizeObserver.disconnect()
      }
    }

    // Start setup after annotation creation delay
    const cleanup = setTimeout(setupResizeObserver, 2100) // After annotation is created

    return () => {
      clearTimeout(cleanup)
    }
  }, [shouldShow])

  const style = textColor ? { color: textColor } : undefined

  return (
    <span 
      ref={elementRef} 
      className="relative inline-block bg-transparent" 
      style={{
        ...style,
        // Prevent layout shifts by maintaining stable dimensions
        minHeight: '1.2em',
        display: 'inline-block',
        verticalAlign: 'baseline',
        // Prevent position changes
        position: 'relative',
        isolation: 'isolate', // Create new stacking context
      }}
    >
      {children}
    </span>
  )
}
