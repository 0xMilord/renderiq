"use client"

import React, { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Send, Upload, HelpCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TooltipProvider } from "@/components/ui/tooltip"

/* eslint-disable @next/next/no-img-element */

interface GalleryRender {
  id: string
  outputUrl: string | null
  inputUrl: string | null
  prompt: string | null
}

interface Message {
  type: "user" | "assistant"
  content: string
  image?: string
  render?: string
  generating?: boolean
}

interface ChatRendererDemoProps {
  className?: string
  galleryRenders?: GalleryRender[]
}

// Truncate prompt to ~80 chars (roughly 2 lines)
function truncatePrompt(prompt: string, maxLength = 80): string {
  if (prompt.length <= maxLength) return prompt
  return prompt.slice(0, maxLength).trim() + "..."
}

export function ChatRendererDemo({ className, galleryRenders = [] }: ChatRendererDemoProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [currentGalleryIndex, setCurrentGalleryIndex] = useState(0)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  // Use gallery renders with output, fallback to demo data if none available
  const availableRenders = galleryRenders.filter(r => r.outputUrl) 
  
  // Fallback demo data
  const fallbackRenders: GalleryRender[] = [
    { id: "1", prompt: "make it photoreal", inputUrl: "/apps/cover/sketch-to-render.jpg", outputUrl: "/apps/cover/render-section-drawing.jpg" },
    { id: "2", prompt: "add warm evening lighting", inputUrl: "/apps/cover/change-lighting.jpg", outputUrl: "/apps/cover/material-alteration.jpg" },
  ]
  
  const rendersToUse = availableRenders.length > 0 ? availableRenders : fallbackRenders

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
    }
  }, [messages, isTyping])

  // Animation sequence - cycles through gallery items
  useEffect(() => {
    if (rendersToUse.length === 0) return

    let isMounted = true
    
    const showGalleryItem = async (index: number) => {
      if (!isMounted) return
      
      const item = rendersToUse[index]
      if (!item) return

      const fullPrompt = item.prompt || "make it photoreal"
      const displayPrompt = truncatePrompt(fullPrompt)
      const inputImage = item.inputUrl || "/apps/cover/sketch-to-render.jpg"
      const outputImage = item.outputUrl!

      // Reset
      setMessages([])
      setInputValue("")
      setIsTyping(false)

      // Show truncated prompt instantly (no typing animation for long prompts)
      await new Promise(r => setTimeout(r, 600))
      if (!isMounted) return
      setInputValue(displayPrompt)

      // Auto-send after brief pause
      await new Promise(r => setTimeout(r, 800))
      if (!isMounted) return
      setInputValue("")
      setMessages([{
        type: "user",
        content: displayPrompt,
        image: inputImage,
      }])

      // Show typing
      await new Promise(r => setTimeout(r, 600))
      if (!isMounted) return
      setIsTyping(true)

      // Show generating render
      await new Promise(r => setTimeout(r, 1000))
      if (!isMounted) return
      setIsTyping(false)
      
      setMessages(prev => [...prev, {
        type: "assistant",
        content: "",
        render: outputImage,
        generating: true,
      }])

      // Complete generation
      await new Promise(r => setTimeout(r, 1500))
      if (!isMounted) return
      setMessages(prev => {
        const newMessages = [...prev]
        const lastIdx = newMessages.length - 1
        if (newMessages[lastIdx]) {
          newMessages[lastIdx] = { ...newMessages[lastIdx], generating: false }
        }
        return newMessages
      })

      // Wait then move to next
      await new Promise(r => setTimeout(r, 3000))
      if (!isMounted) return
      
      const nextIndex = (index + 1) % rendersToUse.length
      setCurrentGalleryIndex(nextIndex)
      showGalleryItem(nextIndex)
    }

    showGalleryItem(currentGalleryIndex)
    
    return () => { isMounted = false }
  }, [rendersToUse.length]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <TooltipProvider>
      <div className={cn("flex flex-col w-full bg-background h-full", className)} style={{ minHeight: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-border bg-card">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground">Visual Lab</span>
            <span className="text-xs text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">Render {currentGalleryIndex + 1}</span>
          </div>
        </div>

        {/* Messages Area - Scrollable, takes remaining space */}
        <div 
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-3 scrollbar-hide"
          style={{ minHeight: '600px', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col",
                message.type === "user" ? "items-end" : "items-start"
              )}
            >
              {/* Sender label */}
              <div className={cn(
                "text-[10px] text-muted-foreground mb-1 px-1 flex items-center gap-1",
                message.type === "user" ? "text-right" : "text-left"
              )}>
                {message.type === "assistant" && (
                  <>
                    <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                      <img src="/logo.svg" alt="Renderiq" className="w-full h-full object-cover" />
                    </div>
                    <span>Renderiq</span>
                  </>
                )}
                {message.type === "user" && "You"}
              </div>

              {/* Message bubble */}
              <div
                className={cn(
                  "rounded-lg p-2 w-[85%]",
                  message.type === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted"
                )}
              >
                {message.content && (
                  <p className="text-xs break-words line-clamp-2">{message.content}</p>
                )}

                {/* User uploaded image - same aspect ratio as render */}
                {message.type === "user" && message.image && (
                  <div className="mt-2 relative w-full rounded overflow-hidden bg-muted/20 border border-white/20" style={{ aspectRatio: '16/9' }}>
                    <img src={message.image} alt="Input" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute bottom-1 left-1 text-[9px] text-white/80 bg-black/50 px-1 rounded">
                      Using uploaded image
                    </div>
                  </div>
                )}

                {/* Generated render - same aspect ratio */}
                {message.type === "assistant" && message.render && (
                  <div className="w-full">
                    <div className="relative w-full rounded overflow-hidden bg-muted/20" style={{ aspectRatio: '16/9' }}>
                      {message.generating ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
                          <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            <span className="text-[10px] text-muted-foreground">Generating...</span>
                          </div>
                        </div>
                      ) : (
                        <img src={message.render} alt="Render" className="absolute inset-0 w-full h-full object-cover" />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex flex-col items-start">
              <div className="text-[10px] text-muted-foreground mb-1 px-1 flex items-center gap-1">
                <div className="w-3 h-3 rounded-full overflow-hidden flex-shrink-0">
                  <img src="/logo.svg" alt="Renderiq" className="w-full h-full object-cover" />
                </div>
                <span>Renderiq</span>
              </div>
              <div className="bg-muted rounded-lg p-2 px-3">
                <div className="flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area - New Layout */}
        <div className="flex-shrink-0 border-t border-border bg-card p-3 space-y-3">
          {/* Row 1: Col1 = Input | Col2 = Upload + Generate stacked */}
          <div className="flex items-stretch gap-2">
            {/* Col 1: Text input */}
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                readOnly
                placeholder="Describe your vision..."
                className="w-full h-full bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
            {/* Col 2: Upload + Generate stacked */}
            <div className="flex flex-col gap-1.5">
              <Button size="sm" variant="default" className="h-7 px-3 text-[10px] font-medium">
                <Send className="h-3 w-3 mr-1" />
                Generate
              </Button>
              <Button variant="outline" size="sm" className="h-7 px-3 text-[10px]">
                <Upload className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
          </div>

          {/* Row 2: Col1 = Settings (2 rows) | Col2 = Style Ref square */}
          <div className="flex gap-3">
            {/* Col 1: Settings in 2 rows */}
            <div className="flex-1 space-y-2">
              {/* Settings Row 1: Mode, Environment, Effect */}
              <div className="flex items-center gap-3 text-[10px]">
                {/* Mode */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Mode</span>
                  <div className="flex bg-muted rounded p-0.5">
                    <button className="flex items-center justify-center w-6 h-6 rounded bg-primary text-primary-foreground">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                      </svg>
                    </button>
                    <button className="flex items-center justify-center w-6 h-6 rounded text-muted-foreground">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Environment */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Environment</span>
                  <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <Select defaultValue="none">
                    <SelectTrigger className="h-6 w-16 text-[10px] bg-muted border-0 px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-[10px]">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Effect */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Effect</span>
                  <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <Select defaultValue="none">
                    <SelectTrigger className="h-6 w-16 text-[10px] bg-muted border-0 px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-[10px]">None</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Settings Row 2: Temperature, Quality */}
              <div className="flex items-center gap-3 text-[10px]">
                {/* Temperature */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Temperature</span>
                  <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <div className="flex bg-muted rounded p-0.5">
                    {[0, 0.25, 0.5, 0.75, 1].map((val) => (
                      <button
                        key={val}
                        className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] min-w-[24px]",
                          val === 0.5 ? "bg-primary text-primary-foreground font-medium" : "text-muted-foreground"
                        )}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Quality */}
                <div className="flex items-center gap-1">
                  <span className="text-muted-foreground">Quality</span>
                  <HelpCircle className="h-2.5 w-2.5 text-muted-foreground/50" />
                  <Select defaultValue="1k">
                    <SelectTrigger className="h-6 w-24 text-[10px] bg-muted border-0 px-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1k" className="text-[10px]">Standard (1K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Col 2: Style Ref - Square placeholder */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] text-muted-foreground">Style Ref</span>
              <div className="w-14 h-14 rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                <Upload className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}
