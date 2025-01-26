"use client";

import React, { useState, KeyboardEvent, useEffect, useRef } from "react";
import { Trash2, History } from "lucide-react";
import { AutoResizeTextArea } from "./auto-resize-textarea";
import { FlashCardType } from "@/lib/types/flashcard";
import { cn } from "@/lib/utils";

interface FlashCardProps {
  card: FlashCardType;
  index: number;
  onUpdate: (index: number, card: FlashCardType) => void;
  onDelete: (index: number) => void;
  isNew?: boolean;
}

export const FlashCard: React.FC<FlashCardProps> = ({
  card,
  index,
  onUpdate,
  onDelete,
  isNew = false,
}) => {
  const [isEditing, setIsEditing] = useState(isNew);
  const [editedCard, setEditedCard] = useState(card);
  const [showingOriginal, setShowingOriginal] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsEditing(isNew);
  }, [isNew]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        setIsEditing(false);
        if (!isFocused) {
          setEditedCard(card);
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [card, isFocused]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!editedCard.original) {
        onUpdate(index, {
          ...editedCard,
          original: {
            front: card.front,
            back: card.back,
          },
        });
      } else {
        onUpdate(index, editedCard);
      }
      setIsEditing(false);
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setEditedCard(card);
    }
  };

  const displayCard =
    showingOriginal && card.original
      ? card.original
      : {
          front: editedCard.front,
          back: editedCard.back,
        };
  const isEdited = card.original !== undefined;

  if (isEditing) {
    return (
      <div
        ref={cardRef}
        className="p-3 border rounded-lg bg-white shadow-sm space-y-2 group"
      >
        <div className="flex items-start gap-2">
          <div className="flex-1 space-y-2">
            <AutoResizeTextArea
              value={editedCard.front}
              onChange={(e) =>
                setEditedCard({ ...editedCard, front: e.target.value })
              }
              placeholder="Question (Enter to save, Shift+Enter for new line, Esc to cancel)"
              autoFocus
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
            />
            <AutoResizeTextArea
              value={editedCard.back}
              onChange={(e) =>
                setEditedCard({ ...editedCard, back: e.target.value })
              }
              placeholder="Answer"
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <button
            onClick={() => onDelete(index)}
            className="text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="group" ref={cardRef}>
      <div
        className={cn(
          "p-3 border rounded-lg hover:bg-gray-50 cursor-pointer space-y-1 relative",
          showingOriginal && "bg-blue-50/50"
        )}
        onDoubleClick={() => setIsEditing(true)}
      >
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1">
            <div className="font-medium">{displayCard.front}</div>
            <div className="text-sm text-gray-600 mt-1">{displayCard.back}</div>
          </div>
          <div className="flex gap-2 opacity-0 group-hover:opacity-100">
            {isEdited && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowingOriginal(!showingOriginal);
                }}
                className={cn(
                  "text-gray-400 hover:text-blue-500 transition-all",
                  showingOriginal && "text-blue-500"
                )}
                title={showingOriginal ? "Show Current" : "Show Original"}
              >
                <History size={16} />
                <span className="sr-only">
                  {showingOriginal ? "Original" : "Edited"}
                </span>
              </button>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(index);
              }}
              className="text-gray-400 hover:text-red-500 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
        {isEdited && (
          <div className="text-xs text-gray-400 mt-2">
            {showingOriginal ? "Showing Original" : "Showing Edited"}
          </div>
        )}
      </div>
    </div>
  );
};
