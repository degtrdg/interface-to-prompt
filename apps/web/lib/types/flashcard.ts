export interface FlashCardType {
  front: string;
  back: string;
  original?: {
    front: string;
    back: string;
  };
}

export interface SelectionRange {
  start: number;
  end: number;
}
