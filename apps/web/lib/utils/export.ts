import { FlashCardType } from "@/lib/types/flashcard";

export const exportToAnkiCSV = (cards: FlashCardType[]): string => {
  // Create CSV header
  const header = "Question,Answer,Comment\n";

  // Convert cards to CSV format
  const cardRows = cards
    .map((card) => {
      // Escape quotes and handle newlines
      const front = card.front.replace(/"/g, '""').replace(/\n/g, " ");
      const back = card.back.replace(/"/g, '""').replace(/\n/g, " ");
      const comment =
        card.comment?.replace(/"/g, '""').replace(/\n/g, " ") || "";
      // Wrap in quotes to handle commas in content
      return `"${front}","${back}","${comment}"`;
    })
    .join("\n");

  return header + cardRows;
};

export const downloadAsFile = (content: string, filename: string) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
};
