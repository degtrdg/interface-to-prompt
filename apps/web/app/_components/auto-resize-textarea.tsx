"use client";

import React from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

export type AutoResizeTextAreaProps = TextareaAutosizeProps;

export const AutoResizeTextArea: React.FC<AutoResizeTextAreaProps> = (
  props
) => {
  return (
    <TextareaAutosize
      className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      {...props}
    />
  );
};
