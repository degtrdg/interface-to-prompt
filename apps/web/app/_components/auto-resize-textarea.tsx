"use client";

import React, { useEffect, useRef } from "react";
import TextareaAutosize, {
  TextareaAutosizeProps,
} from "react-textarea-autosize";

export interface AutoResizeTextAreaProps extends TextareaAutosizeProps {
  onFocus?: () => void;
  onBlur?: () => void;
}

export const AutoResizeTextArea: React.FC<AutoResizeTextAreaProps> = ({
  onFocus,
  onBlur,
  ...props
}) => {
  return (
    <TextareaAutosize
      className="w-full p-2 border rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
      onFocus={onFocus}
      onBlur={onBlur}
      {...props}
    />
  );
};
