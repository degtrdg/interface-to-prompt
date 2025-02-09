import { FlashCardType } from "@/lib/types/flashcard";

interface QuestionStatsProps {
  questions: FlashCardType[] | undefined;
  seenIds: Set<string>;
  editedIds: Set<string>;
  allDeletedIds: Set<string>;
}

export function QuestionStats({
  questions = [],
  seenIds,
  editedIds,
  allDeletedIds,
}: QuestionStatsProps) {
  return (
    <div className="flex gap-4 text-sm text-muted-foreground">
      <div className="flex items-center gap-1">
        <span className="font-medium">{questions.length}</span>
        <span>active</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{editedIds.size}</span>
        <span>edited</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{allDeletedIds.size}</span>
        <span>deleted</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">{seenIds.size}</span>
        <span>total</span>
      </div>
    </div>
  );
}
