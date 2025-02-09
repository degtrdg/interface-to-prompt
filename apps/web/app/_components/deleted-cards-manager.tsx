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
  shouldWarnAboutExcess?: boolean;
}

export function DeletedCardsManager({
  deletedCards,
  currentCardsCount,
  onPermanentDelete,
  onClearAll,
  className,
  shouldWarnAboutExcess = false,
}: DeletedCardsManagerProps) {
  if (deletedCards.length === 0) return null;

  const excessCardCount = Math.max(0, deletedCards.length - currentCardsCount);
  const sortedCards = [...deletedCards].sort((a, b) => {
    const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
    const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
    return dateA - dateB; // Oldest first
  });

  // Only split into safe/at risk if shouldWarnAboutExcess is true
  const safeCards = shouldWarnAboutExcess
    ? sortedCards.slice(0, currentCardsCount)
    : [];
  const atRiskCards = shouldWarnAboutExcess
    ? sortedCards.slice(currentCardsCount)
    : [];

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
          {shouldWarnAboutExcess && excessCardCount > 0 && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                You have {excessCardCount} more deleted cards than current
                cards. The {excessCardCount} most recently deleted cards will be
                permanently deleted when you next generate questions. Review
                these cards below and restore any you want to keep. We&apos;re
                doing this because we don&apos;t want to overwhelm the prompt
                with negative examples.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {shouldWarnAboutExcess ? (
              <>
                {safeCards.length > 0 && (
                  <div key="safe-cards-section">
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
                  </div>
                )}

                {atRiskCards.length > 0 && (
                  <div key="at-risk-cards-section">
                    <div className="text-sm font-medium text-red-500 pt-4">
                      {atRiskCards.length} cards at risk of deletion (most
                      recently deleted):
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
                  </div>
                )}
              </>
            ) : (
              // When not warning about excess, just show all cards in chronological order
              sortedCards.map((card) => (
                <FlashCardComponent
                  key={card.id}
                  card={card}
                  onDelete={() => onPermanentDelete(card)}
                  onUpdate={() => {}}
                  isNew={false}
                />
              ))
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
