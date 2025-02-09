import { create } from "zustand";
import { FlashCardType } from "@/lib/types/flashcard";

interface CardsState {
  // Core card collections
  cards: FlashCardType[];
  generatedCards: FlashCardType[];
  deletedCards: FlashCardType[];

  // Stats tracking
  seenIds: Set<string>;
  editedIds: Set<string>;
  allDeletedIds: Set<string>;

  // Basic actions that affect global card state
  addCard: (card: FlashCardType) => void;
  addGeneratedCard: (card: FlashCardType) => void;
  updateCard: (updatedCard: FlashCardType) => void;
  deleteCard: (cardToDelete: FlashCardType) => void;
  moveToDeleted: (card: FlashCardType, source: "generated" | "manual") => void;
  clearDeletedCards: () => void;
  setGeneratedCards: (cards: FlashCardType[]) => void;

  // Stats tracking actions
  markCardSeen: (cardId: string) => void;
  markCardEdited: (cardId: string) => void;
}

export const useCardsStore = create<CardsState>((set) => ({
  // Initial states
  cards: [],
  generatedCards: [],
  deletedCards: [],
  seenIds: new Set<string>(),
  editedIds: new Set<string>(),
  allDeletedIds: new Set<string>(),

  // Card collection actions
  addCard: (card) => {
    set((state) => ({
      cards: [...state.cards, card],
    }));
  },

  addGeneratedCard: (card) => {
    set((state) => ({
      generatedCards: [...state.generatedCards, card],
    }));
  },

  updateCard: (updatedCard) => {
    set((state) => ({
      cards: state.cards.map((card) =>
        card.id === updatedCard.id ? updatedCard : card
      ),
    }));
  },

  deleteCard: (cardToDelete) => {
    set((state) => ({
      cards: state.cards.filter((card) => card.id !== cardToDelete.id),
    }));
  },

  moveToDeleted: (card, source) => {
    const deletedCard: FlashCardType = {
      ...card,
      deletedAt: new Date().toISOString(),
      source,
    };

    set((state) => ({
      deletedCards: [...state.deletedCards, deletedCard],
      allDeletedIds: new Set(state.allDeletedIds).add(card.id),
      cards: state.cards.filter((c) => c.id !== card.id),
      generatedCards: state.generatedCards.filter((c) => c.id !== card.id),
    }));
  },

  clearDeletedCards: () => {
    set({ deletedCards: [] });
  },

  setGeneratedCards: (cards) => {
    set({ generatedCards: cards });
  },

  // Stats actions
  markCardSeen: (cardId) => {
    set((state) => ({
      seenIds: new Set(state.seenIds).add(cardId),
    }));
  },

  markCardEdited: (cardId) => {
    set((state) => ({
      editedIds: new Set(state.editedIds).add(cardId),
    }));
  },
}));
