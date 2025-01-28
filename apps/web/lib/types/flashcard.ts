export interface FlashCardType {
  id: string;
  front: string;
  back: string;
  comment?: string;
  original?: {
    front: string;
    back: string;
    comment?: string;
  };
  deletedAt?: string;
  source?: "generated" | "manual";
}

export interface SelectionRange {
  start: number;
  end: number;
}
