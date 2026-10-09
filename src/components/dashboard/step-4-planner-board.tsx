
"use client";

import * as React from "react";
import { differenceInMinutes } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { PlannedTask, PersonnelIcon, Productivity, Warehouse } from "@/lib/types";
import { Trash2, HardHat, Loader2 } from "lucide-react";
import { useDnd } from "@/contexts/dnd-context";
import { cn } from "@/lib/utils";

interface Step4PlannerBoardProps {
  tasks: PlannedTask[];
  onDeleteTask: (taskId: string) => void;
  onDropOnTask: (taskId: string) => void;
  productiveHoursPerPerson: number;
  baseProductivity: Productivity[];
  isLoading: boolean;
  warehouse: Warehouse;
}

function TaskRow({ task, onDeleteTask, onDropOnTask, productiveHoursPerPerson, baseProductivity, shiftStartTime, efficiencyRatio }: { task: PlannedTask; onDeleteTask: (taskId: string) => void; onDropOnTask: (taskId: string) => void, productiveHoursPerPerson: number, baseProductivity: Productivity[], shiftStartTime: Date, efficiencyRatio: number }) {
    const { draggedItem, setDraggedItem, setSourceTaskId } = useDnd();
    const [isOver, setIsOver] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        if(draggedItem) setIsOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        if(draggedItem) onDropOnTask(task.id);
        setIsOver(false);
    };

    const handlePersonDragStart = (person: PersonnelIcon) => {
        setDraggedItem(person);
        setSourceTaskId(task.id);
    };

    // Calculations for the row
    const productivityData = baseProductivity.find(p => p.id === task.productivityId);
    const productivityPerHour = productivityData?.productivity || 0;
    const assignedStaffCount = task.assignedStaff.length;
    const capacityAchieved = assignedStaffCount * productiveHoursPerPerson * productivityPerHour;
    const surplusOrDeficit = capacityAchieved - task.target;
    const meetsGoal = surplusOrDeficit >= 0;
    
    const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && productivityPerHour > 0)
        ? Math.ceil(task.target / (productiveHoursPerPerson * productivityPerHour))
        : 0;

    const staffBalance = assignedStaffCount - theoreticalStaffNeeded;

    const unit = task.unitOfMeasure || 'unidades';

    const completionTime = React.useMemo(() => {
        if (efficiencyRatio === 0 || assignedStaffCount === 0 || productivityPerHour === 0) {
            return "N/A";
        }

        const totalProductivityPerHour = assignedStaffCount * productivityPerHour;
        const productiveHoursToComplete = task.target / totalProductivityPerHour;
        
        // This is how many minutes of "wall clock" time it will take
        const wallClockMinutesToComplete = (productiveHoursToComplete * 60) / efficiencyRatio;

        const completionDate = new Date(shiftStartTime.getTime() + wallClockMinutesToComplete * 60 * 1000);

        return completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
    }, [task.target, task.assignedStaff.length, efficiencyRatio, shiftStartTime, productivityPerHour]);

    return (
        <TableRow 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn("transition-all", isOver ? "bg-accent/50 outline-2 outline-dashed outline-primary" : "")}
        >
            <TableCell className="font-medium">{task.group || 'N/A'}</TableCell>
            <TableCell className="font-medium">{task.name}</TableCell>
            <TableCell>
                 {productivityData?.equipment && Object.keys(productivityData.equipment).length > 0 ? (
                    <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        {Object.entries(productivityData.equipment).map(([name, req]) => (
                            <div key={name} className="flex items-center gap-1">
                                <HardHat className="h-3 w-3" />
                                <span>{name} (Req: {req})</span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <span className="text-xs text-muted-foreground">-</span>
                )}
            </TableCell>
            <TableCell>
                <div className="flex flex-wrap gap-1 min-h-10 items-center">
                    {task.assignedStaff.map((person, index) => (
                        <div
                            key={`${person.id}-${index}`}
                            draggable
                            onDragStart={() => handlePersonDragStart(person)}
                            onDragEnd={() => { setDraggedItem(null); setSourceTaskId(null); }}
                            className="p-1 text-xl cursor-grab rounded-full bg-muted hover:bg-primary/10 transition-colors"
                            title="Arrastrar para reasignar"
                        >
                            {person.icon}
                        </div>
                    ))}
                </div>
            </TableCell>
            <TableCell className="text-center">{task.assignedStaff.length}</TableCell>
            <TableCell className={cn("text-center font-bold", staffBalance < 0 ? "text-destructive" : "text-green-600")}>
                {staffBalance > 0 ? `+${staffBalance}` : staffBalance}
            </TableCell>
             <TableCell className="text-center">{Math.round(capacityAchieved).toLocaleString()} <span className="text-xs text-muted-foreground">/{unit}</span></TableCell>
            <TableCell className="text-center">{task.target.toLocaleString()} <span className="text-xs text-muted-foreground">/{unit}</span></TableCell>
            <TableCell className={cn("text-center font-bold", surplusOrDeficit < 0 ? "text-destructive" : "text-green-600")}>
                {Math.round(surplusOrDeficit).toLocaleString()} <span className="text-xs text-muted-foreground">/{unit}</span>
            </TableCell>
            <TableCell className="text-center font-semibold">{completionTime}</TableCell>
            <TableCell className="text-center">
                <Badge variant={meetsGoal ? "default" : "destructive"} className={cn(meetsGoal && "bg-green-600")}>
                    {meetsGoal ? "CUMPLE" : "NO CUMPLE"}
                </Badge>
            </TableCell>
            <TableCell>
                <Button variant="ghost" size="icon" onClick={() => onDeleteTask(task.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </TableCell>
        </TableRow>
    );
}


export function Step4PlannerBoard({ tasks, onDeleteTask, onDropOnTask, productiveHoursPerPerson, baseProductivity, isLoading, warehouse }: Step4PlannerBoardProps) {

  const { shiftStartTime, efficiencyRatio } = React.useMemo(() => {
    if (!warehouse) {
        return { shiftStartTime: new Date(), efficiencyRatio: 0 };
    }
    const start = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftStartTime}`);
    const end = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftEndTime}`);
    if (end <= start) {
        end.setDate(end.getDate() + 1);
    }

    const totalShiftMinutes = differenceInMinutes(end, start);
    const totalBreakMinutes = warehouse.breakTime + warehouse.lunchTime;
    const productiveMinutesPerPerson = totalShiftMinutes - totalBreakMinutes;
    const ratio = totalShiftMinutes > 0 ? productiveMinutesPerPerson / totalShiftMinutes : 0;
    
    return { shiftStartTime: start, efficiencyRatio: ratio };
  }, [warehouse]);

  if (isLoading) {
    return (
        <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50 transition-all duration-300">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground mt-4">Cargando tareas del tablero...</p>
        </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg bg-muted/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <p className="text-muted-foreground">No hay tareas en el tablero.</p>
        <p className="text-sm text-muted-foreground">Añada tareas desde el Paso 2 para comenzar a planificar.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Proceso</TableHead>
            <TableHead>Equipamiento Req.</TableHead>
            <TableHead>Personal Asignado</TableHead>
            <TableHead className="text-center">Nº Pers.</TableHead>
            <TableHead className="text-center">Balance Personal</TableHead>
            <TableHead className="text-center">Capacidad Lograda</TableHead>
            <TableHead className="text-center">Cant. Objetivo</TableHead>
            <TableHead className="text-center">Sobrante / Faltante</TableHead>
            <TableHead className="text-center">Hora Fin Est.</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map(task => (
            <TaskRow 
                key={task.id} 
                task={task} 
                onDeleteTask={onDeleteTask} 
                onDropOnTask={onDropOnTask} 
                productiveHoursPerPerson={productiveHoursPerPerson}
                baseProductivity={baseProductivity}
                shiftStartTime={shiftStartTime}
                efficiencyRatio={efficiencyRatio}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
