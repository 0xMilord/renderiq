'use client';

import React from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
}

export function MobileDrawer({ isOpen, onClose, children, className }: MobileDrawerProps) {
  const handleDragEnd = (event: any, info: PanInfo) => {
    // If dragged down more than 100px or with velocity > 500, close the drawer
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={onClose}
          />
          
          {/* Drawer Handle */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ 
              type: 'spring', 
              damping: 30, 
              stiffness: 300,
              duration: 0.3 
            }}
            className="fixed bottom-16 left-0 right-0 z-50 lg:hidden"
          >
            {/* Handle Bar */}
            <div 
              className="bg-background border-t border-border rounded-t-lg cursor-pointer shadow-lg h-12 flex items-center justify-center"
              onClick={() => onClose()}
            >
              <div className="flex flex-col items-center space-y-1">
                <div className="w-12 h-1 bg-muted-foreground rounded-full" />
                <span className="text-xs text-muted-foreground">Swipe down to close</span>
              </div>
            </div>
            
            {/* Drawer Content */}
            <motion.div
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 0.2 }}
              onDragEnd={handleDragEnd}
              className={cn(
                "bg-background border-t border-border max-h-[calc(100vh-8rem)] overflow-hidden",
                className
              )}
              style={{ touchAction: 'pan-y' }}
            >
              <div className="h-[calc(100vh-12rem)] overflow-y-auto">
                {children}
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
