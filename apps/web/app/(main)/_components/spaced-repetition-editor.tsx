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
import { FocusTextReview } from "@/app/(main)/_components/focus-text-review";
import { generateId } from "@/lib/utils/generateId";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { DeletedCardsManager } from "@/app/_components/deleted-cards-manager";

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

  // Add new state for text focus mode
  const [isTextFocusMode, setIsTextFocusMode] = useState(false);
  const [textSections, setTextSections] = useState<string[]>([]);

  // Add new state for deleted cards
  const [deletedCards, setDeletedCards] = useState<FlashCardType[]>([]);

  // Add new state for deleted cards expansion
  const [isDeletedCardsExpanded, setIsDeletedCardsExpanded] = useState(false);

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

  // Add cleanup function for deleted cards
  const cleanupDeletedCards = () => {
    if (deletedCards.length <= cards.length) return;

    // Sort by date, keep only the most recent ones up to cards.length
    const sortedCards = [...deletedCards].sort((a, b) => {
      const dateA = a.deletedAt ? new Date(a.deletedAt).getTime() : 0;
      const dateB = b.deletedAt ? new Date(b.deletedAt).getTime() : 0;
      return dateB - dateA;
    });

    setDeletedCards(sortedCards.slice(0, cards.length));
  };

  // Update handleGenerateClick to cleanup deleted cards
  const handleGenerateClick = async () => {
    if (!selectedText || isGenerating) return;

    // Cleanup excess deleted cards before generating new ones
    cleanupDeletedCards();

    setIsGenerating(true);
    try {
      const newQuestions = await generateQuestions(
        conversation,
        selectedText,
        cards
      );
      const newQuestionsWithId = newQuestions.map((card) => ({
        ...card,
        id: generateId(),
      }));
      setGeneratedCards(newQuestionsWithId);
      if (newQuestionsWithId.length > 0) {
        setIsFocusMode(true);
      }
    } catch (error) {
      console.error("Error generating questions:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  // Update card management functions to use IDs
  const handleUpdateCard = (
    updatedCard: FlashCardType,
    isGenerated = false
  ) => {
    if (isGenerated) {
      setGeneratedCards((prev) =>
        prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
      );
    } else {
      setCards((prev) =>
        prev.map((card) => (card.id === updatedCard.id ? updatedCard : card))
      );
    }
  };

  const handleDeleteCard = (
    cardToDelete: FlashCardType,
    isGenerated = false
  ) => {
    const deletedCard: FlashCardType = {
      ...cardToDelete,
      deletedAt: new Date().toISOString(),
      source: isGenerated ? "generated" : "manual",
    };
    setDeletedCards((prev) => [...prev, deletedCard]);

    if (isGenerated) {
      setGeneratedCards((prev) =>
        prev.filter((card) => card.id !== cardToDelete.id)
      );
    } else {
      setCards((prev) => prev.filter((card) => card.id !== cardToDelete.id));
    }
  };

  const handleAcceptGenerated = (card: FlashCardType) => {
    const cardToAdd = {
      ...card,
      id: generateId(), // New ID for accepted card
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

      // Split the formatted content into sections and enter text focus mode
      const sections = formattedContent
        .split("---")
        .map((section) => section.trim())
        .filter((section) => section.length > 0);

      if (sections.length > 0) {
        setTextSections(sections);
        setIsTextFocusMode(true);
        setIsInputMode(false);
      }
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

  // Add handler to permanently delete a card from deleted cards
  const handlePermanentDelete = (cardToDelete: FlashCardType) => {
    setDeletedCards((prev) =>
      prev.filter(
        (card) =>
          card.front !== cardToDelete.front || card.back !== cardToDelete.back
      )
    );
  };

  // Modify renderRightSide to use Collapsible
  const renderRightSide = () => {
    if (isFocusMode && generatedCards.length > 0) {
      return (
        <div className="w-1/2 flex justify-center">
          <FocusCardsReview
            generatedCards={generatedCards}
            onUpdate={(updatedCard) => handleUpdateCard(updatedCard, true)}
            onDelete={(card) => handleDeleteCard(card, true)}
            onCloseFocus={() => setIsFocusMode(false)}
            onAccept={handleAcceptGenerated}
          />
        </div>
      );
    }

    return (
      <div className="w-1/2 overflow-auto h-screen pb-4">
        <div className="flex flex-col gap-4 p-4">
          {/* Primary Action - Review Generated Questions */}
          {generatedCards.length > 0 && (
            <Card className="p-6">
              <div className="flex flex-col gap-2">
                <h3 className="text-lg font-medium">New Questions Ready!</h3>
                <p className="text-sm text-gray-500">
                  {generatedCards.length} questions have been generated from
                  your text. Review them to add to your collection.
                </p>
                <Button
                  size="lg"
                  className="w-full mt-2"
                  onClick={() => setIsFocusMode(true)}
                >
                  Review {generatedCards.length} Generated Questions
                </Button>
              </div>
            </Card>
          )}

          {/* Secondary Actions */}
          <div className="flex items-center gap-2">
            <Collapsible className="w-full">
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full">
                  <ChevronDown className="h-4 w-4 mr-2 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                  Add Cards Manually
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="pt-4">
                <NewQuestionForm
                  onAdd={(card) => setCards((prev) => [...prev, card])}
                />
              </CollapsibleContent>
            </Collapsible>
          </div>

          <Separator className="my-2" />

          {/* Existing cards */}
          {cards.length > 0 && (
            <Card className="p-4">
              <Collapsible defaultOpen>
                <div className="flex items-center justify-between">
                  <CollapsibleTrigger className="flex items-center gap-2 hover:opacity-80 py-2">
                    <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                    <h3 className="font-medium">
                      Existing Cards ({cards.length})
                    </h3>
                  </CollapsibleTrigger>
                </div>
                <CollapsibleContent className="pt-2">
                  <div className="space-y-3">
                    {cards.map((card) => (
                      <FlashCardComponent
                        key={card.id}
                        card={card}
                        onUpdate={(updatedCard) =>
                          handleUpdateCard(updatedCard)
                        }
                        onDelete={() => handleDeleteCard(card)}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Deleted cards section */}
          <DeletedCardsManager
            deletedCards={deletedCards}
            currentCardsCount={cards.length}
            onPermanentDelete={handlePermanentDelete}
            onClearAll={() => setDeletedCards([])}
          />
        </div>
      </div>
    );
  };

  // Modify the left side JSX to conditionally render FocusTextReview
  const renderLeftSide = () => {
    if (isTextFocusMode) {
      return (
        <FocusTextReview
          sections={textSections}
          onGenerateQuestions={(selectedText) => {
            setSelectedText(selectedText);
            return handleGenerateClick();
          }}
          onCloseFocus={() => setIsTextFocusMode(false)}
          isGenerating={isGenerating}
        />
      );
    }

    return (
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
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setIsInputMode(!isInputMode);
                setSelectedText("");
                setSelectionRange(null);
              }}
            >
              {isInputMode ? "Done Editing" : "Edit Text"}
            </Button> */}
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
    );
  };

  return (
    <div className="h-screen flex gap-4 p-4 bg-gray-100 overflow-hidden">
      {/* Left side - Conversation Editor */}
      <div className="w-1/2">{renderLeftSide()}</div>

      {/* Right side - Card Management */}
      {renderRightSide()}
    </div>
  );
};

export default SpacedRepetitionEditor;
