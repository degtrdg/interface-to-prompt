import { create } from "zustand";
import { formatContent } from "@/actions/content-format-actions";

interface EditorState {
  // Editor content states
  conversation: string;
  isInputMode: boolean;
  selectedText: string;
  textSections: string[];
  isTextFocusMode: boolean;
  isFormatting: boolean;

  // Actions
  setConversation: (content: string) => void;
  setIsInputMode: (mode: boolean) => void;
  setSelectedText: (text: string) => void;
  setIsTextFocusMode: (value: boolean) => void;
  handleFormatClick: () => Promise<void>;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  // Initial states
  conversation: "",
  isInputMode: true,
  selectedText: "",
  textSections: [],
  isTextFocusMode: false,
  isFormatting: false,

  // Simple setters
  setConversation: (content: string) => set({ conversation: content }),
  setIsInputMode: (mode: boolean) => set({ isInputMode: mode }),
  setSelectedText: (text: string) => set({ selectedText: text }),
  setIsTextFocusMode: (value: boolean) => set({ isTextFocusMode: value }),

  // Complex actions
  handleFormatClick: async () => {
    const { conversation, isFormatting } = get();
    if (!conversation || isFormatting) return;
    set({ isFormatting: true });

    try {
      const formattedContent = await formatContent(conversation);
      set({ conversation: formattedContent });

      const sections = formattedContent
        .split("---")
        .map((sec) => sec.trim())
        .filter((sec) => sec.length > 0);

      if (sections.length > 0) {
        set({
          textSections: sections,
          isTextFocusMode: true,
          isInputMode: false,
        });
      }
    } finally {
      set({ isFormatting: false });
    }
  },
}));
