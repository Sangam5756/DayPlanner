"use client";

import { useState } from "react";
import { Task } from "@/types";

export const useModals = () => {
  const [modal, setModal] = useState<"task" | "ai" | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModal("task");
  };

  const closeModal = () => {
    setModal(null);
    setEditingTask(null);
  };

  return {
    modal,
    setModal,
    editingTask,
    openEditModal,
    closeModal
  };
};
