"use client";
import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NewQuestionForm } from "@/app/_components/new-question-form";
import { FlashCard as FlashCardComponent } from "@/app/_components/flash-card";
import { FlashCardType, SelectionRange } from "@/lib/types/flashcard";

const mockGenerateQuestions = (): FlashCardType[] => [
  {
    front: "What happens when electrons move through a conductor?",
    back: "They collide with atoms, creating resistance and heat",
  },
  {
    front: "Why do some materials become superconductors at low temperatures?",
    back: "Electrons form Cooper pairs that move without collisions",
  },
];

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

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

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
  const handleGenerateClick = () => {
    if (!selectedText) return;
    const newQuestions = mockGenerateQuestions();
    // Store the generated version as the original
    const questionsWithOriginal = newQuestions.map((q) => ({
      ...q,
      original: {
        front: q.front,
        back: q.back,
      },
    }));
    setGeneratedCards(questionsWithOriginal);
  };

  // Update an existing or generated card
  const handleUpdateCard = (
    index: number,
    updatedCard: FlashCardType,
    isGenerated = false
  ) => {
    if (isGenerated) {
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
    // Ensure we preserve the original version when accepting
    const cardToAdd = card.original
      ? card
      : {
          ...card,
          original: {
            front: card.front,
            back: card.back,
          },
        };
    setCards((prev) => [...prev, cardToAdd]);
    setGeneratedCards((prev) => prev.filter((c) => c !== card));
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

  return (
    <div className="flex h-screen gap-4 p-4 bg-gray-100">
      {/* Left side - Conversation Editor */}
      <div className="w-1/2">
        <Card className="h-full p-4 flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-gray-500">
              {isInputMode
                ? "Enter your text below"
                : conversation
                  ? "Select text to generate questions"
                  : "Double tap text area to edit"}
            </div>
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
                className="w-full h-full min-h-[600px] p-2 whitespace-pre-wrap border rounded-lg relative select-text cursor-text"
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                onDoubleClick={() => setIsInputMode(true)}
              >
                {renderContent()}
              </div>
            )}
          </ScrollArea>
        </Card>
      </div>

      {/* Right side - Card Management */}
      <div className="w-1/2 flex flex-col gap-4">
        <NewQuestionForm
          onAdd={(card) => setCards((prev) => [...prev, card])}
        />

        {selectedText && !isInputMode && (
          <Button onClick={handleGenerateClick} className="w-full">
            Generate Questions from Selection
          </Button>
        )}

        {/* Generated questions */}
        {generatedCards.length > 0 && (
          <Card className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">New Questions</h3>
              <div className="text-sm text-gray-500">
                Edit and press Enter to accept
              </div>
            </div>
            <div className="space-y-3">
              {generatedCards.map((card, i) => (
                <FlashCardComponent
                  key={i}
                  card={card}
                  index={i}
                  onUpdate={(index, updatedCard) => {
                    handleUpdateCard(index, updatedCard, true);
                    handleAcceptGenerated(updatedCard);
                  }}
                  onDelete={(index) => handleDeleteCard(index, true)}
                  isNew={true}
                />
              ))}
            </div>
          </Card>
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
    </div>
  );
};

export default SpacedRepetitionEditor;
