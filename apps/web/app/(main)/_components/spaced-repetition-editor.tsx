"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NewQuestionForm } from "@/app/_components/new-question-form";
import { FlashCard as FlashCardComponent } from "@/app/_components/flash-card";
import { FlashCardType, SelectionRange } from "@/lib/types/flashcard";
import {
  formatContent,
  generateQuestions,
} from "@/actions/content-format-actions";
import { FocusCardsReview } from "@/app/(main)/_components/focus-cards-review";

const SpacedRepetitionEditor: React.FC = () => {
  // Conversation data
  const [conversation, setConversation] = useState("");
  const [isInputMode, setIsInputMode] = useState(true);

  // Text selection for generating questions
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<SelectionRange | null>(
    null
  );

  // Card data
  const [cards, setCards] = useState<FlashCardType[]>([]);
  const [generatedCards, setGeneratedCards] = useState<FlashCardType[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  // Loading state for formatting
  const [isFormatting, setIsFormatting] = useState(false);

  // Add new state for focus mode
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [focusedCardIndex, setFocusedCardIndex] = useState(0);

  // Handle content updates
  const handleContentUpdate = (content: string) => {
    setConversation(content);
  };

  // Capture user's text selection
  const handleTextSelection = () => {
    if (isInputMode) return;

    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedText("");
      setSelectionRange(null);
      return;
    }

    const text = selection.toString().trim();
    if (text) {
      const range = selection.getRangeAt(0);
      const container = viewerRef.current;
      if (container && container.contains(range.commonAncestorContainer)) {
        setSelectedText(text);
        setSelectionRange({
          start: range.startOffset,
          end: range.endOffset,
        });
      }
    }
  };

  // Close text editor when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        viewerRef.current &&
        !viewerRef.current.contains(event.target as Node)
      ) {
        setIsInputMode(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Generate new questions from selected text
  const handleGenerateClick = async () => {
    if (!selectedText || isGenerating) return;

    setIsGenerating(true);
    try {
      const newQuestions = await generateQuestions(
        conversation,
        selectedText,
        cards
      );
      setGeneratedCards(newQuestions);
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update an existing or generated card
  const handleUpdateCard = (
    index: number,
    updatedCard: FlashCardType,
    isGenerated = false
  ) => {
    if (isGenerated) {
      // Just update the generated card in place
      setGeneratedCards((prev) => {
        const newCards = [...prev];
        newCards[index] = updatedCard;
        return newCards;
      });
    } else {
      setCards((prev) => {
        const newCards = [...prev];
        newCards[index] = updatedCard;
        return newCards;
      });
    }
  };

  // Delete a card
  const handleDeleteCard = (index: number, isGenerated = false) => {
    if (isGenerated) {
      setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
    } else {
      setCards((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // Accept a generated card and move it to the main list
  const handleAcceptGenerated = (card: FlashCardType) => {
    const cardToAdd = {
      ...card,
      original: card.original || {
        front: card.front,
        back: card.back,
      },
    };
    setCards((prev) => [...prev, cardToAdd]);
  };

  // Conditionally highlight selection
  const renderContent = () => {
    if (!conversation) return null;

    if (selectionRange && !isInputMode) {
      return (
        <>
          {conversation.substring(0, selectionRange.start)}
          <span className="bg-yellow-200">
            {conversation.substring(selectionRange.start, selectionRange.end)}
          </span>
          {conversation.substring(selectionRange.end)}
        </>
      );
    }

    return conversation;
  };

  const handleFormatClick = async () => {
    if (!conversation || isFormatting) return;
    setIsFormatting(true);
    try {
      const formattedContent = await formatContent(conversation);
      setConversation(formattedContent);
    } finally {
      setIsFormatting(false);
    }
  };

  // Add keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFocusMode) return;

      if ((e.metaKey || e.ctrlKey) && e.key === "ArrowLeft") {
        setFocusedCardIndex((prev) => Math.max(0, prev - 1));
      } else if ((e.metaKey || e.ctrlKey) && e.key === "ArrowRight") {
        setFocusedCardIndex((prev) =>
          Math.min(generatedCards.length - 1, prev + 1)
        );
      } else if (e.key === "Escape") {
        setIsFocusMode(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode, generatedCards.length, focusedCardIndex]);

  // Modify the right side JSX
  const renderRightSide = () => {
    if (isFocusMode && generatedCards.length > 0) {
      return (
        <FocusCardsReview
          generatedCards={generatedCards}
          onUpdate={(index, updatedCard) =>
            handleUpdateCard(index, updatedCard, true)
          }
          onDelete={(index) => {
            handleDeleteCard(index, true);
          }}
          onCloseFocus={() => setIsFocusMode(false)}
          onAccept={handleAcceptGenerated}
        />
      );
    }

    return (
      <div className="w-1/2 flex flex-col gap-4">
        <NewQuestionForm
          onAdd={(card) => setCards((prev) => [...prev, card])}
        />

        {selectedText && !isInputMode && (
          <Button
            onClick={handleGenerateClick}
            className="w-full"
            disabled={isGenerating}
          >
            {isGenerating
              ? "Generating Questions..."
              : "Generate Questions from Selection"}
          </Button>
        )}

        {/* New Questions Queue Button */}
        {generatedCards.length > 0 && (
          <Button
            className="w-full"
            onClick={() => setIsFocusMode(true)}
            variant="outline"
          >
            Review New Questions ({generatedCards.length})
          </Button>
        )}

        <Separator className="my-2" />

        {/* Existing cards */}
        {cards.length > 0 && (
          <Card className="flex-1 p-4">
            <h3 className="font-medium mb-3">
              Existing Cards ({cards.length})
            </h3>
            <ScrollArea className="h-[calc(100vh-400px)]">
              <div className="space-y-3">
                {cards.map((card, i) => (
                  <FlashCardComponent
                    key={i}
                    card={card}
                    index={i}
                    onUpdate={handleUpdateCard}
                    onDelete={handleDeleteCard}
                  />
                ))}
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-100">
      {/* Left side - Conversation Editor */}
      <div className="w-1/2">
        <Card className="h-full p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">
              {isInputMode
                ? "Enter your text below"
                : "Select text to generate questions"}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleFormatClick}
                disabled={isFormatting}
              >
                {isFormatting ? "Formatting..." : "Format Content"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsInputMode(!isInputMode);
                  setSelectedText("");
                  setSelectionRange(null);
                }}
              >
                {isInputMode ? "Done Editing" : "Edit Text"}
              </Button>
            </div>
          </div>
          <ScrollArea className="flex-1">
            {isInputMode ? (
              <textarea
                ref={editorRef}
                className="w-full h-full min-h-[600px] p-2 whitespace-pre-wrap border rounded-lg resize-none"
                value={conversation}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onSelect={(e) => {
                  const textarea = e.currentTarget;
                  const selectionStart = textarea.selectionStart;
                  const selectionEnd = textarea.selectionEnd;
                  if (selectionEnd > selectionStart) {
                    const selected = textarea.value.substring(
                      selectionStart,
                      selectionEnd
                    );
                    setSelectedText(selected);
                    setSelectionRange({
                      start: selectionStart,
                      end: selectionEnd,
                    });
                  }
                }}
              />
            ) : (
              <div
                ref={viewerRef}
                className="w-full h-full min-h-[600px] p-2 whitespace-pre-wrap border rounded-lg relative select-text cursor-text font-mono "
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
              >
                {renderContent()}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Right side - Card Management */}
      {renderRightSide()}
    </div>
  );
};

export default SpacedRepetitionEditor;
