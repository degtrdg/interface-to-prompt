"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FlashCardType } from "@/lib/types/flashcard";
import { AutoResizeTextArea } from "@/app/_components/auto-resize-textarea";

interface FocusCardsReviewProps {
  generatedCards: FlashCardType[];
  onUpdate: (index: number, updated: FlashCardType) => void;
  onDelete: (index: number) => void;
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
  const [focusedIndex, setFocusedIndex] = useState(0);
  const currentCard = generatedCards[focusedIndex];

  const handleTextChange = (field: "front" | "back", text: string) => {
    onUpdate(focusedIndex, {
      ...currentCard,
      [field]: text,
    });
  };

  const handleDelete = () => {
    onDelete(focusedIndex);

    // If we've removed the last card, close focus entirely
    if (generatedCards.length <= 1) {
      onCloseFocus();
    } else {
      // If we removed something in the middle, remain at the same index if possible
      setFocusedIndex((prev) => Math.min(prev, generatedCards.length - 2));
    }
  };

  const handleAccept = () => {
    onAccept(currentCard);
    onDelete(focusedIndex); // Remove the card from generated cards after accepting

    // If we've accepted the last card, close focus entirely
    if (generatedCards.length <= 1) {
      onCloseFocus();
    } else {
      // Move to next card if available
      setFocusedIndex((prev) => Math.min(prev + 1, generatedCards.length - 2)); // -2 because we're removing a card
    }
  };

  const handlePrevious = () => {
    if (focusedIndex > 0) {
      setFocusedIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (focusedIndex < generatedCards.length - 1) {
      setFocusedIndex((prev) => prev + 1);
    }
  };

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in a text input
      const target = e.target as HTMLElement;
      const isInInput =
        target.tagName === "TEXTAREA" || target.tagName === "INPUT";

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
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentCard, focusedIndex, generatedCards.length]); // Added navigation-related dependencies

  return (
    <Card className="w-full p-4 flex flex-col h-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onCloseFocus}>
          Exit Focus Mode (Esc)
        </Button>
        <div className="text-sm text-gray-500">
          Card {focusedIndex + 1} of {generatedCards.length}
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
      </div>

      {/* Footer actions */}
      <div className="flex justify-between mt-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={focusedIndex === 0}
            onClick={handlePrevious}
          >
            ← Previous (⌘←)
          </Button>
          <Button
            variant="outline"
            disabled={focusedIndex === generatedCards.length - 1}
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
