"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashCard as FlashCardComponent } from "./flash-card";
import { FlashCardType } from "@/lib/types/flashcard";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface DeletedCardsManagerProps {
  deletedCards: FlashCardType[];
  currentCardsCount: number;
  onPermanentDelete: (card: FlashCardType) => void;
  onClearAll: () => void;
  className?: string;
}

export function DeletedCardsManager({
  deletedCards,
  currentCardsCount,
  onPermanentDelete,
  onClearAll,
  className,
}: DeletedCardsManagerProps) {
  if (deletedCards.length === 0) return null;

  const excessCardCount = Math.max(0, deletedCards.length - currentCardsCount);
  const sortedCards = [...deletedCards].sort((a, b) => {
    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return dateA - dateB; // Oldest first
  });

  // First currentCardsCount are safe (oldest ones)
  const safeCards = sortedCards.slice(0, currentCardsCount);
  // Rest are at risk (newer ones)
  const atRiskCards = sortedCards.slice(currentCardsCount);

  return (
    <Card className={cn("p-4", className)}>
      <Collapsible>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 py-2">
            <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
            <span className="font-medium">
              Deleted Cards ({deletedCards.length})
            </span>
          </CollapsibleTrigger>
          <Button variant="ghost" size="sm" onClick={onClearAll}>
            Clear All
          </Button>
        </div>
        <CollapsibleContent className="pt-2">
          {excessCardCount > 0 && (
            <Alert variant="warning" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You have {excessCardCount} more deleted cards than current
                cards. The {excessCardCount} most recently deleted cards will be
                permanently deleted when you next generate questions. Review
                these cards below and restore any you want to keep. We're doing
                this because we don't want to overwhelm the prompt with negative
                examples.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {safeCards.length > 0 && (
              <>
                <div className="text-sm font-medium text-gray-500 pt-2">
                  Keeping {safeCards.length} oldest deleted cards:
                </div>
                {safeCards.map((card) => (
                  <FlashCardComponent
                    key={card.id}
                    card={card}
                    onDelete={() => onPermanentDelete(card)}
                    onUpdate={() => {}}
                    isNew={false}
                  />
                ))}
              </>
            )}

            {atRiskCards.length > 0 && (
              <>
                <div className="text-sm font-medium text-red-500 pt-4">
                  {atRiskCards.length} cards at risk of deletion (most recently
                  deleted):
                </div>
                {atRiskCards.map((card) => (
                  <FlashCardComponent
                    key={card.id}
                    card={card}
                    onDelete={() => onPermanentDelete(card)}
                    onUpdate={() => {}}
                    isNew={false}
                  />
                ))}
              </>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
