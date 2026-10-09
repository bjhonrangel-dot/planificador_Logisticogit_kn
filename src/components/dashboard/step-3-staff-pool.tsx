"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PersonnelIcon } from "@/lib/types";
import { useDnd } from "@/contexts/dnd-context";
import { cn } from "@/lib/utils";

interface Step3StaffPoolProps {
  staffInReserve: PersonnelIcon[];
  onDrop: () => void;
}

export function Step3StaffPool({ staffInReserve, onDrop }: Step3StaffPoolProps) {
  const { setDraggedItem } = useDnd();
  const [isOver, setIsOver] = React.useState(false);
  
  const handleDragStart = (person: PersonnelIcon) => {
    setDraggedItem(person);
  };
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onDrop();
    setIsOver(false);
  };

  return (
    <div>
        <h3 className="text-lg font-bold tracking-tight mb-2">3. Personal en Reserva ({staffInReserve.length})</h3>
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn("transition-all duration-300 min-h-28 hover:shadow-xl hover:-translate-y-1", isOver && "bg-accent/50 border-dashed border-primary")}
        >
            <CardContent className="flex flex-wrap gap-2 p-4">
                {staffInReserve.map((person, index) => (
                    <div
                        key={`${person.id}-${index}`}
                        draggable
                        onDragStart={() => handleDragStart(person)}
                        onDragEnd={() => setDraggedItem(null)}
                        className="p-2 text-3xl cursor-grab rounded-full bg-muted hover:bg-primary/10 transition-colors"
                        title="Arrastrar para asignar"
                    >
                        {person.icon}
                    </div>
                ))}
                {staffInReserve.length === 0 && (
                    <div className="text-muted-foreground text-sm p-4 text-center w-full">
                        Todo el personal ha sido asignado.
                    </div>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
