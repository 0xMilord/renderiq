"use client";
import { useState, memo, useCallback } from "react";
import { cn } from "@/lib/utils";

interface ExpandableCard {
  id: number;
  content: React.ReactNode;
}

interface ExpandableCardsProps {
  cards: ExpandableCard[];
  defaultExpanded?: number;
  className?: string;
}

const ExpandableCards = memo(function ExpandableCards({
  cards,
  defaultExpanded = 1,
  className,
}: ExpandableCardsProps) {
  const [expandedId, setExpandedId] = useState<number>(defaultExpanded);

  const handleMouseEnter = useCallback((id: number) => {
    setExpandedId(id);
  }, []);

  return (
    <div className={cn("flex gap-2 w-full h-full", className)}>
      {cards.map((card) => {
        const isExpanded = expandedId === card.id;

        return (
          <div
            key={card.id}
            className={cn(
              "relative h-full overflow-hidden rounded-xl cursor-pointer transition-all duration-300 ease-out",
              isExpanded ? "flex-[3]" : "flex-1"
            )}
            onMouseEnter={() => handleMouseEnter(card.id)}
          >
            <div className="absolute inset-0">{card.content}</div>
          </div>
        );
      })}
    </div>
  );
});

export default ExpandableCards;
