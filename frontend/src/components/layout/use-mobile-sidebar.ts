"use client";

import { useCallback, useState } from "react";

export const useMobileSidebar = () => {
  const [isOpen, setOpen] = useState(false);
  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  return { isOpen, open, close };
};

