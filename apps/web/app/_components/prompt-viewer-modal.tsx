import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getQuestionGeneratorPrompt } from "@/lib/prompts/question-generation";
import { FlashCardType } from "@/lib/types/flashcard";
import { QuestionStats } from "./question-stats";

interface PromptSection {
  type: "text" | "xml";
  title?: string;
  content: string;
  xmlTag?: string;
}

interface PromptViewerModalProps {
  fullConversation: string;
  selection: string;
  questions: FlashCardType[];
  deletedQuestions?: FlashCardType[];
  seenIds: Set<string>;
  editedIds: Set<string>;
  allDeletedIds: Set<string>;
}

function processQuestionsForPrompt(
  questions: FlashCardType[] | undefined
): Array<{
  front: string;
  back: string;
  original?: { front: string; back: string };
}> {
  if (!questions || !Array.isArray(questions)) {
    return [];
  }

  return questions.map(({ front, back, original }) => {
    // Only include original if it's different from current front/back
    const hasChanged =
      original && (original.front !== front || original.back !== back);
    return {
      front,
      back,
      ...(hasChanged ? { original } : {}),
    };
  });
}

function parsePrompt(promptString: string): PromptSection[] {
  const sections: PromptSection[] = [];
  let currentText = "";

  // Split the prompt into parts based on XML tags
  const parts = promptString.split(/(<\/?[^>]+>)/);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];

    if (part.startsWith("</")) {
      // Closing tag - skip
      continue;
    } else if (part.startsWith("<")) {
      // Opening tag
      if (currentText.trim()) {
        sections.push({
          type: "text",
          content: currentText.trim(),
        });
        currentText = "";
      }

      // Get tag name
      const tagName = part.replace(/<|>/g, "");
      // Get content (next part)
      const content = parts[i + 1];
      i++; // Skip content in next iteration

      // Convert tag name from snake case to title case
      const toTitleCase = (str: string) =>
        str
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

      sections.push({
        type: "xml",
        xmlTag: tagName,
        title: toTitleCase(tagName),
        content: content.trim(),
      });
    } else {
      currentText += part;
    }
  }

  // Add any remaining text
  if (currentText.trim()) {
    sections.push({
      type: "text",
      content: currentText.trim(),
    });
  }

  return sections;
}

export function PromptViewerModal({
  fullConversation,
  selection,
  questions,
  deletedQuestions,
  seenIds,
  editedIds,
  allDeletedIds,
}: PromptViewerModalProps) {
  const promptSections = useMemo(() => {
    const processedQuestions = processQuestionsForPrompt(questions);
    const processedDeletedQuestions = deletedQuestions
      ? processQuestionsForPrompt(deletedQuestions)
      : undefined;

    const prompt = getQuestionGeneratorPrompt({
      fullConversation,
      selection,
      exampleQuestions: JSON.stringify(processedQuestions, null, 2),
      deletedQuestions: processedDeletedQuestions
        ? JSON.stringify(processedDeletedQuestions, null, 2)
        : undefined,
    });
    return parsePrompt(prompt);
  }, [fullConversation, selection, questions, deletedQuestions]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          View Prompt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl h-[80vh]">
        <DialogHeader className="space-y-2">
          <DialogTitle>Question Generation Prompt</DialogTitle>
          <QuestionStats
            questions={questions}
            seenIds={seenIds}
            editedIds={editedIds}
            allDeletedIds={allDeletedIds}
          />
        </DialogHeader>
        <ScrollArea className="h-full pr-4">
          <div className="space-y-4 py-4">
            <div className="prose dark:prose-invert space-y-4">
              {promptSections.map((section, index) => {
                if (section.type === "text") {
                  return <p key={index}>{section.content}</p>;
                }

                return (
                  <React.Fragment key={index}>
                    <Collapsible className="border rounded-lg not-prose">
                      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-gray-100 dark:hover:bg-gray-800">
                        <span className="font-medium">{section.title}</span>
                        <ChevronDown className="h-4 w-4 transition-transform duration-200 [&[data-state=open]]:rotate-180" />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-4 pt-0 font-mono text-sm whitespace-pre-wrap border-t">
                          {section.content}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
