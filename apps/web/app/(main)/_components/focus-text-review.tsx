"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { cn } from "@/lib/utils";
import { useEditorStore } from "@/app/stores/editor-store";

interface FocusTextReviewProps {
  sections: string[];
  onGenerateQuestions: (selectedText: string) => void;
  isGenerating: boolean;
}

export const FocusTextReview: React.FC<FocusTextReviewProps> = ({
  sections,
  onGenerateQuestions,
  isGenerating,
}) => {
  const { setSelectedText, selectedText } = useEditorStore();
  const [focusedIndex, setFocusedIndex] = useState(0);

  useEffect(() => {
    setSelectedText(sections[focusedIndex]);
  }, [focusedIndex, sections, setSelectedText]);

  const handlePrevious = () => {
    if (focusedIndex > 0) {
      setFocusedIndex((prev) => prev - 1);
    }
  };

  const handleNext = () => {
    if (focusedIndex < sections.length - 1) {
      setFocusedIndex((prev) => prev + 1);
    }
  };

  return (
    <Card className="h-full p-4 flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant="outline"
            disabled={focusedIndex === 0 || isGenerating}
            onClick={handlePrevious}
          >
            ← Previous
          </Button>
          <Button
            variant="outline"
            disabled={focusedIndex === sections.length - 1 || isGenerating}
            onClick={handleNext}
          >
            Next →
          </Button>
        </div>
        <div className="flex gap-2">
          <Button
            variant="default"
            onClick={() => {
              console.log(
                "Generating questions for section front:",
                selectedText
              );
              onGenerateQuestions(selectedText);
            }}
            disabled={isGenerating}
          >
            {isGenerating ? "Generating Questions..." : "Generate Questions"}
          </Button>
        </div>
      </div>
      <div className="flex-1 overflow-auto prose prose-sm md:prose-base lg:prose-lg dark:prose-invert max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({
              inline,
              className,
              children,
              ...props
            }: {
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
            }) {
              const match = /language-(\w+)/.exec(className || "");
              return !inline && match ? (
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  className="rounded-md"
                  {...props}
                >
                  {String(children).replace(/\n$/, "")}
                </SyntaxHighlighter>
              ) : (
                <code
                  className={cn("bg-muted px-1.5 py-0.5 rounded-sm", className)}
                  {...props}
                >
                  {children}
                </code>
              );
            },
            p: ({ children }) => (
              <p className="leading-7 [&:not(:first-child)]:mt-6">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="my-6 ml-6 list-disc [&>li]:mt-2">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="my-6 ml-6 list-decimal [&>li]:mt-2">{children}</ol>
            ),
            blockquote: ({ children }) => (
              <blockquote className="mt-6 border-l-2 pl-6 italic">
                {children}
              </blockquote>
            ),
            h1: ({ children }) => (
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">
                {children}
              </h3>
            ),
          }}
        >
          {selectedText}
        </ReactMarkdown>
      </div>

      <div className="flex justify-end items-center mt-4">
        <div className="text-sm text-gray-500">
          Section {focusedIndex + 1} of {sections.length}
        </div>
      </div>
    </Card>
  );
};
