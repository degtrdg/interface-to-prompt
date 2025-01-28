"use client";

import React, { useState, KeyboardEvent } from "react";
import { Card } from "@/components/ui/card";
import { AutoResizeTextArea } from "./auto-resize-textarea";
import { FlashCardType } from "@/lib/types/flashcard";

interface NewQuestionFormProps {
  onAdd: (card: FlashCardType) => void;
}

export const NewQuestionForm: React.FC<NewQuestionFormProps> = ({ onAdd }) => {
  const [newCard, setNewCard] = useState<FlashCardType>({
    front: "",
    back: "",
    comment: "",
  });

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Cmd+Enter (Mac) or Ctrl+Enter (Windows)
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      if (newCard.front.trim() && newCard.back.trim()) {
        onAdd(newCard);
        setNewCard({ front: "", back: "", comment: "" });
      }
    }
  };

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <AutoResizeTextArea
          value={newCard.front}
          onChange={(e) => setNewCard({ ...newCard, front: e.target.value })}
          placeholder="Type new question... (Cmd+Enter to add)"
          onKeyDown={handleKeyDown}
        />
        <AutoResizeTextArea
          value={newCard.back}
          onChange={(e) => setNewCard({ ...newCard, back: e.target.value })}
          placeholder="Type answer..."
          onKeyDown={handleKeyDown}
        />
        <AutoResizeTextArea
          value={newCard.comment || ""}
          onChange={(e) => setNewCard({ ...newCard, comment: e.target.value })}
          placeholder="Add a comment (optional)..."
          onKeyDown={handleKeyDown}
        />
      </div>
    </Card>
  );
};
