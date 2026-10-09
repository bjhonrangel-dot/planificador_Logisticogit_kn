'use client';

import type { ReactNode } from 'react';
import { createContext, useContext, useState } from 'react';
import type { PersonnelIcon } from '@/lib/types';

interface DndContextType {
  draggedItem: PersonnelIcon | null;
  setDraggedItem: (item: PersonnelIcon | null) => void;
  sourceTaskId: string | null;
  setSourceTaskId: (id: string | null) => void;
}

const DndContext = createContext<DndContextType | null>(null);

export function DndProvider({ children }: { children: ReactNode }) {
  const [draggedItem, setDraggedItem] = useState<PersonnelIcon | null>(null);
  const [sourceTaskId, setSourceTaskId] = useState<string | null>(null); // To know where the staff member came from

  return (
    <DndContext.Provider value={{ draggedItem, setDraggedItem, sourceTaskId, setSourceTaskId }}>
      {children}
    </DndContext.Provider>
  );
}

export function useDnd() {
  const context = useContext(DndContext);
  if (!context) {
    throw new Error('useDnd must be used within a DndProvider');
  }
  return context;
}
