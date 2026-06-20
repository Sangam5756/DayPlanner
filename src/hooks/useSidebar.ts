"use client";

import { useState } from "react";

export const useSidebar = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return { sidebarOpen, setSidebarOpen };
};
