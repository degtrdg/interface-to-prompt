"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashCardType } from "@/lib/types/flashcard";
import { AutoResizeTextArea } from "@/app/_components/auto-resize-textarea";

interface FocusCardsReviewProps {
  generatedCards: FlashCardType[];
  onUpdate: (updatedCard: FlashCardType) => void;
  onDelete: (card: FlashCardType) => void;
  onCloseFocus: () => void;
  onAccept: (card: FlashCardType) => void;
}

export const FocusCardsReview: React.FC<FocusCardsReviewProps> = ({
  generatedCards,
  onUpdate,
  onDelete,
  onCloseFocus,
  onAccept,
}) => {
  // Store the ID of the focused card instead of an index
  const [focusedCardId, setFocusedCardId] = useState<string | null>(
    generatedCards.length > 0 ? generatedCards[0].id : null
  );

  // Find the current card by ID
  const currentCard = generatedCards.find((c) => c.id === focusedCardId);

  // Get the current index for display purposes
  const currentIndex = currentCard
    ? generatedCards.findIndex((c) => c.id === currentCard.id)
    : -1;

  // If there's no card that matches the ID, close focus or move to next available
  useEffect(() => {
    if (!currentCard && generatedCards.length > 0) {
      setFocusedCardId(generatedCards[0].id);
    } else if (generatedCards.length === 0) {
      onCloseFocus();
    }
  }, [generatedCards, currentCard, onCloseFocus]);

  const handleTextChange = (
    field: "front" | "back" | "comment",
    text: string
  ) => {
    if (!currentCard) return;
    onUpdate({ ...currentCard, [field]: text });
  };

  const handleDelete = () => {
    if (currentCard) {
      onDelete(currentCard);
    }
  };

  const handleAccept = () => {
    if (currentCard) {
      onAccept(currentCard);
      onDelete(currentCard);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setFocusedCardId(generatedCards[currentIndex - 1].id);
    }
  };

  const handleNext = () => {
    if (currentIndex < generatedCards.length - 1) {
      setFocusedCardId(generatedCards[currentIndex + 1].id);
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in a text input
      //   const target = e.target as HTMLElement;
      //   const isInInput =
      //     target.tagName === "TEXTAREA" || target.tagName === "INPUT";

      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case "Enter":
            e.preventDefault();
            handleAccept();
            break;
          case "Backspace":
            e.preventDefault();
            handleDelete();
            break;
          case "ArrowLeft":
            e.preventDefault();
            handlePrevious();
            break;
          case "ArrowRight":
            e.preventDefault();
            handleNext();
            break;
        }
      } else if (e.key === "Escape") {
        onCloseFocus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard]);

  if (!currentCard) {
    return null;
  }

  return (
    <Card className="w-[600px] p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onCloseFocus}>
          Exit Focus Mode (Esc)
        </Button>
        <div className="text-sm text-gray-500">
          Card {currentIndex + 1} of {generatedCards.length}
        </div>
      </div>

      {/* Inputs for question and answer */}
      <div className="flex-1 flex flex-col gap-4 overflow-auto">
        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Question:</label>
          <AutoResizeTextArea
            className="border p-2 rounded"
            placeholder="Enter question..."
            value={currentCard.front}
            onChange={(e) => handleTextChange("front", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Answer:</label>
          <AutoResizeTextArea
            className="border p-2 rounded"
            placeholder="Enter answer..."
            value={currentCard.back}
            onChange={(e) => handleTextChange("back", e.target.value)}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm text-gray-600">Comment (optional):</label>
          <AutoResizeTextArea
            className="border p-2 rounded"
            placeholder="Add a comment..."
            value={currentCard.comment || ""}
            onChange={(e) => handleTextChange("comment", e.target.value)}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex justify-between mt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={currentIndex === 0}
            onClick={handlePrevious}
          >
            ← Previous (⌘←)
          </Button>
          <Button
            variant="outline"
            disabled={currentIndex === generatedCards.length - 1}
            onClick={handleNext}
          >
            Next (⌘→) →
          </Button>
        </div>
        <Button variant="destructive" onClick={handleDelete}>
          Delete (⌘⌫)
        </Button>
        <Button variant="outline" onClick={handleAccept}>
          Accept Card (⌘↵)
        </Button>
      </div>
    </Card>
  );
};
