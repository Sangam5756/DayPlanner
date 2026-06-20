"use client";

import { useState, useCallback } from "react";

export const useNotice = () => {
  const [notice, setNotice] = useState("");

  const showNotice = useCallback((text: string) => {
    setNotice(text);
    window.setTimeout(() => setNotice(""), 4500);
  }, []);

  return { notice, showNotice };
};
