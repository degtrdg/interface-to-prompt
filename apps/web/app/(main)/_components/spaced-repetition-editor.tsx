"use client";
import React, { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { NewQuestionForm } from "@/app/_components/new-question-form";
import { FlashCard as FlashCardComponent } from "@/app/_components/flash-card";
import { generateQuestions } from "@/actions/content-format-actions";
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
import { PromptViewerModal } from "@/app/_components/prompt-viewer-modal";
import { useEditorStore } from "@/app/stores/editor-store";
import { useCardsStore } from "@/app/stores/cards-store";

const SpacedRepetitionEditor: React.FC = () => {
  // Editor state from store
  const {
    conversation,
    selectedText,
    textSections,
    isTextFocusMode,
    isFormatting,
    setConversation,
    handleFormatClick,
  } = useEditorStore();

  // Cards state from store
  const {
    cards,
    generatedCards,
    deletedCards,
    seenIds,
    editedIds,
    allDeletedIds,
    addCard,
    updateCard,
    moveToDeleted,
    clearDeletedCards,
    setGeneratedCards,
  } = useCardsStore();

  // Local UI states
  const [isGenerating, setIsGenerating] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);

  // Refs
  const editorRef = useRef<HTMLTextAreaElement>(null);

  // Handle content updates
  const handleContentUpdate = (content: string) => {
    setConversation(content);
  };

  // Update handleGenerateClick to use the stores
  const handleGenerateClick = async (text: string) => {
    if (!text || isGenerating) return;

    setIsGenerating(true);
    try {
      const newQuestions = await generateQuestions(
        conversation,
        text,
        cards,
        deletedCards
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

  // Modify renderRightSide to use Collapsible
  const renderRightSide = () => {
    if (isFocusMode && generatedCards.length > 0) {
      return (
        <div className="w-1/2 flex justify-center">
          <FocusCardsReview
            generatedCards={generatedCards}
            onUpdate={(updatedCard) => updateCard(updatedCard)}
            onDelete={(card) => moveToDeleted(card, "generated")}
            onCloseFocus={() => setIsFocusMode(false)}
            onAccept={(card) => {
              const cardToAdd = {
                ...card,
                id: generateId(),
                original: card.original || {
                  front: card.front,
                  back: card.back,
                },
              };
              addCard(cardToAdd);
            }}
          />
        </div>
      );
    }

    return (
      <div className="w-1/2 overflow-auto h-screen pb-4">
        <div className="flex flex-col gap-4 p-4">
          {/* Prompt Viewer Modal */}
          <PromptViewerModal
            fullConversation={conversation}
            selection={selectedText}
            questions={cards}
            deletedQuestions={deletedCards}
            seenIds={seenIds}
            editedIds={editedIds}
            allDeletedIds={allDeletedIds}
          />
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
                <NewQuestionForm onAdd={addCard} />
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
                        onUpdate={updateCard}
                        onDelete={() => moveToDeleted(card, "manual")}
                      />
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Card>
          )}

          {/* Deleted cards section */}
          {/* <DeletedCardsManager
            deletedCards={deletedCards}
            currentCardsCount={cards.length}
            onPermanentDelete={(card) => moveToDeleted(card, "manual")}
            onClearAll={clearDeletedCards}
          /> */}
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
          onGenerateQuestions={handleGenerateClick}
          isGenerating={isGenerating}
        />
      );
    }

    return (
      <Card className="h-full p-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <div className="text-sm text-gray-500">Enter your text below</div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFormatClick}
              disabled={isFormatting}
            >
              {isFormatting ? "Formatting..." : "Format Content"}
            </Button>
          </div>
        </div>
        <ScrollArea className="flex-1">
          <textarea
            ref={editorRef}
            className="w-full h-full min-h-[600px] p-2 whitespace-pre-wrap border rounded-lg resize-none"
            value={conversation}
            onChange={(e) => handleContentUpdate(e.target.value)}
          />
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
