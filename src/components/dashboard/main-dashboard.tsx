"use client";

import * as React from "react";
import { differenceInMinutes } from "date-fns";
import type { Warehouse, PlannedTask, PersonnelIcon, Productivity, EquipmentStatus } from "@/lib/types";
import { Step1Settings } from "./step-1-settings";
import { Step2Tasks } from "./step-2-tasks";
import { Step3StaffPool } from "./step-3-staff-pool";
import { Step4PlannerBoard } from "./step-4-planner-board";
import { Step5Analysis } from "./step-5-analysis";
import { StatsBar } from "./stats-bar";
import { useDnd } from "@/contexts/dnd-context";
import { Button } from "@/components/ui/button";
import { Key, Users, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Separator } from "@/components/ui/separator";
import { useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { collection, doc, query, writeBatch } from 'firebase/firestore';

interface MainDashboardProps {
  warehouse: Warehouse;
  onUpdateWarehouse: (warehouse: Warehouse) => void;
}

export function MainDashboard({ warehouse, onUpdateWarehouse }: MainDashboardProps) {
  const { toast } = useToast();
  const { firestore } = useFirebase();
  const [currentWarehouse, setCurrentWarehouse] = React.useState(warehouse);
  const { draggedItem, setDraggedItem, sourceTaskId, setSourceTaskId } = useDnd();

  const tasksQuery = useMemoFirebase(() => {
    if (!firestore || !currentWarehouse.id) return null;
    return query(collection(firestore, 'warehouses', currentWarehouse.id, 'tasks'));
  }, [firestore, currentWarehouse.id]);

  const { data: plannedTasks, isLoading: isLoadingTasks } = useCollection<PlannedTask>(tasksQuery);
  
  React.useEffect(() => {
    setCurrentWarehouse(warehouse);
  }, [warehouse]);

  const {
    availableStaff,
    totalShiftMinutes,
    totalBreakMinutes,
    productiveMinutesPerPerson,
    productiveHoursPerPerson,
    totalManHours,
  } = React.useMemo(() => {
    const availableStaff = currentWarehouse.totalStaff - currentWarehouse.absentStaff;
    const shiftStartTime = new Date(`${currentWarehouse.shiftDate.slice(0, 10)}T${currentWarehouse.shiftStartTime}`);
    const shiftEndTime = new Date(`${currentWarehouse.shiftDate.slice(0, 10)}T${currentWarehouse.shiftEndTime}`);
    if (shiftEndTime <= shiftStartTime) {
      shiftEndTime.setDate(shiftEndTime.getDate() + 1);
    }
    const totalShiftMinutes = differenceInMinutes(shiftEndTime, shiftStartTime);
    const totalBreakMinutes = currentWarehouse.breakTime + currentWarehouse.lunchTime;
    const productiveMinutesPerPerson = totalShiftMinutes - totalBreakMinutes;
    const productiveHoursPerPerson = productiveMinutesPerPerson / 60;
    const totalManHours = availableStaff * productiveHoursPerPerson;
    return {
      availableStaff,
      totalShiftMinutes,
      totalBreakMinutes,
      productiveMinutesPerPerson,
      productiveHoursPerPerson,
      totalManHours,
    };
  }, [currentWarehouse]);

  const stats = {
    availableStaff,
    totalShiftHours: totalShiftMinutes / 60,
    totalBreakMinutes,
    productiveHoursPerPerson,
    totalManHours,
  };
  
  const handleUpdateSettings = (newSettings: Partial<Warehouse>) => {
    const updatedWarehouse = { ...currentWarehouse, ...newSettings };
    setCurrentWarehouse(updatedWarehouse);
    onUpdateWarehouse(updatedWarehouse);
  };

  const handleAddTask = (productivityId: string, target: number) => {
    if (!firestore) return;
    const productivity = currentWarehouse.baseProductivity.find(p => p.id === productivityId);
    if (!productivity) return;

    const newTask: Omit<PlannedTask, 'id'> = {
      warehouseId: currentWarehouse.id,
      productivityId,
      group: productivity.group || '',
      name: productivity.name,
      unitOfMeasure: productivity.unitOfMeasure || 'unidades',
      target,
      assignedStaff: [],
      status: 'Not Started',
    };
    
    const tasksCol = collection(firestore, 'warehouses', currentWarehouse.id, 'tasks');
    addDocumentNonBlocking(tasksCol, newTask).then(docRef => {
        if(docRef) {
            updateDocumentNonBlocking(docRef, { id: docRef.id });
        }
    }).catch(error => {
        console.error("Error creating task:", error);
    });
  };

  const handleDeleteTask = (taskId: string) => {
    if (!firestore) return;
    const taskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', taskId);
    deleteDocumentNonBlocking(taskRef);
  };
  
  const handleDropOnTask = (taskId: string) => {
    if (!draggedItem || !firestore || !plannedTasks) return;

    const targetTask = plannedTasks.find((t) => t.id === taskId);
    if (!targetTask) {
        setDraggedItem(null);
        setSourceTaskId(null);
        return;
    }

    const productivity = currentWarehouse.baseProductivity.find(p => p.id === targetTask.productivityId);
    
    // Check for equipment limit
    if (productivity?.equipment) {
        for (const equipName in productivity.equipment) {
            const requiredPerPerson = productivity.equipment[equipName];
            const totalAvailable = currentWarehouse.equipment[equipName] || 0;
            
            // Calculate how many staff can be supported by the available equipment
            const maxStaffForEquipment = Math.floor(totalAvailable / requiredPerPerson);
            
            if (targetTask.assignedStaff.length >= maxStaffForEquipment) {
                toast({
                    variant: "destructive",
                    title: "Límite de Equipo Alcanzado",
                    description: `No se puede asignar más personal a "${targetTask.name}" debido al límite de ${totalAvailable} de "${equipName}".`
                });
                setDraggedItem(null);
                setSourceTaskId(null);
                return;
            }
        }
    }
  
    const batch = writeBatch(firestore);
    
    // Add to new task
    const isAlreadyInTask = targetTask.assignedStaff.some((p: PersonnelIcon) => p.id === draggedItem.id);
    if (!isAlreadyInTask) {
        const targetTaskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', taskId);
        batch.update(targetTaskRef, {
            assignedStaff: [...targetTask.assignedStaff, draggedItem]
        });
    }

    // Remove from old task
    if (sourceTaskId && sourceTaskId !== taskId) {
        const sourceTask = plannedTasks.find(t => t.id === sourceTaskId);
        if (sourceTask) {
            const sourceTaskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', sourceTaskId);
            batch.update(sourceTaskRef, {
                assignedStaff: sourceTask.assignedStaff.filter((p: PersonnelIcon) => p.id !== draggedItem.id)
            });
        }
    }

    batch.commit().catch(error => {
        console.error("Error updating tasks in batch: ", error);
        toast({ variant: "destructive", title: "Error al mover personal" });
    });
  
    setDraggedItem(null);
    setSourceTaskId(null);
  };


  const handleDropOnReserve = () => {
    if (!draggedItem || !sourceTaskId || !firestore || !plannedTasks) return;

    const sourceTask = plannedTasks.find(t => t.id === sourceTaskId);
    if (sourceTask) {
        const sourceTaskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', sourceTaskId);
        updateDocumentNonBlocking(sourceTaskRef, {
            assignedStaff: sourceTask.assignedStaff.filter(p => p.id !== draggedItem.id)
        });
    }
    
    setDraggedItem(null);
    setSourceTaskId(null);
  };
  
  const handleClearBoard = () => {
    if (!firestore || !plannedTasks) return;
    const batch = writeBatch(firestore);
    plannedTasks.forEach(task => {
        const taskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', task.id);
        batch.delete(taskRef);
    });
    batch.commit().then(() => {
        toast({ title: "Tablero limpiado", description: "Todas las tareas han sido eliminadas del plan." });
    }).catch(error => {
        console.error("Error clearing board: ", error);
        toast({ variant: "destructive", title: "Error al limpiar el tablero" });
    });
  };
  
  const handleUnassignAll = () => {
    if (!firestore || !plannedTasks) return;
    const batch = writeBatch(firestore);
    plannedTasks.forEach(task => {
        const taskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', task.id);
        batch.update(taskRef, { assignedStaff: [] });
    });
    batch.commit().then(() => {
        toast({ title: "Personal desasignado", description: "Todo el personal ha sido devuelto a la reserva." });
    }).catch(error => {
         console.error("Error unassigning staff: ", error);
        toast({ variant: "destructive", title: "Error al desasignar personal" });
    });
  };
  
  const handleOptimize = () => {
    if (!firestore || !plannedTasks) return;

    let availableIconsFlat: PersonnelIcon[] = [];
    for (let i = 0; i < availableStaff; i++) {
        availableIconsFlat.push({
            id: `person-${i}`,
            icon: currentWarehouse.personnelIcons[i % currentWarehouse.personnelIcons.length].icon,
        });
    }

    const batch = writeBatch(firestore);

    // First, reset all assignments
    const tasksWithNeeds = plannedTasks.map(task => {
        const taskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', task.id);
        batch.update(taskRef, { assignedStaff: [] });
        
        const productivityData = currentWarehouse.baseProductivity.find(p => p.id === task.productivityId);
        const productivityPerHour = productivityData?.productivity || 0;
        
        const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && productivityPerHour > 0)
            ? Math.ceil(task.target / (productiveHoursPerPerson * productivityPerHour))
            : 0;

        let maxStaffByEquipment = Infinity;
        if (productivityData?.equipment) {
            for (const equipName in productivityData.equipment) {
                const requiredPerPerson = productivityData.equipment[equipName];
                const totalAvailable = currentWarehouse.equipment[equipName] || 0;
                const maxForThisEquip = Math.floor(totalAvailable / requiredPerPerson);
                if (maxForThisEquip < maxStaffByEquipment) {
                    maxStaffByEquipment = maxForThisEquip;
                }
            }
        }
        
        const finalStaffNeeded = Math.min(theoreticalStaffNeeded, maxStaffByEquipment);
        const deficit = task.target; // Deficit is the full target before assignment

        return { ...task, staffNeeded: finalStaffNeeded, deficit, assignedStaff: [] as PersonnelIcon[] }; // start with empty staff
    }).sort((a, b) => b.deficit - a.deficit);

    tasksWithNeeds.forEach(taskToAssign => {
        const staffToAssignCount = taskToAssign.staffNeeded;
        
        for (let i = 0; i < staffToAssignCount; i++) {
            if (availableIconsFlat.length > 0) {
                const person = availableIconsFlat.shift()!;
                taskToAssign.assignedStaff.push(person);
            } else {
                break;
            }
        }
        
        const taskRef = doc(firestore, 'warehouses', currentWarehouse.id, 'tasks', taskToAssign.id);
        batch.update(taskRef, { assignedStaff: taskToAssign.assignedStaff });
    });
    
    batch.commit().then(() => {
        toast({ title: "Distribución Óptima Aplicada", description: "El personal ha sido asignado para maximizar el cumplimiento." });
    }).catch(error => {
        console.error("Error optimizing board: ", error);
        toast({ variant: "destructive", title: "Error al optimizar" });
    });
  }

  const allPersonnelIcons = React.useMemo(() => {
    if (!plannedTasks) return [];
    const assignedIds = new Set(plannedTasks.flatMap(task => task.assignedStaff.map(p => p.id)));
    const reserveIcons: PersonnelIcon[] = [];
    
    for (let i = 0; i < availableStaff; i++) {
        const id = `person-${i}`;
        if (!assignedIds.has(id)) {
            reserveIcons.push({
                id,
                icon: currentWarehouse.personnelIcons[i % currentWarehouse.personnelIcons.length].icon,
            });
        }
    }
    return reserveIcons;
  }, [availableStaff, currentWarehouse.personnelIcons, plannedTasks]);


  const analysisData = React.useMemo(() => {
    if (!plannedTasks) return { tasksWithData: [], overallCompliance: 0, totalTarget: 0, totalCapacity: 0 };
    
    const tasksWithData = plannedTasks.map(task => {
        const productivityData = currentWarehouse.baseProductivity.find(p => p.id === task.productivityId);
        const productivityPerHour = productivityData?.productivity || 0;
        const capacityAchieved = task.assignedStaff.length * productiveHoursPerPerson * productivityPerHour;
        const surplusOrDeficit = capacityAchieved - task.target;
        return { 
          ...task, 
          capacityAchieved, 
          surplusOrDeficit,
          productivityData,
          productivityPerHour
        };
    });

    const totalTarget = tasksWithData.reduce((acc, task) => acc + task.target, 0);
    // Corrected totalCapacity: it's the sum of the *capped* capacity for each task.
    const totalAchievedCapacity = tasksWithData.reduce((acc, task) => {
        // The contribution of a task to the total capacity cannot exceed its own target.
        const cappedCapacity = Math.min(task.capacityAchieved, task.target);
        return acc + cappedCapacity;
    }, 0);

    const overallCompliance = totalTarget > 0 ? (totalAchievedCapacity / totalTarget) * 100 : 0;
    
    // The raw total capacity (uncapped) is still useful for other metrics.
    const totalPotentialCapacity = tasksWithData.reduce((acc, task) => acc + task.capacityAchieved, 0);

    return {
        tasksWithData,
        overallCompliance,
        totalTarget,
        totalCapacity: totalPotentialCapacity // Keep original total for other analysis if needed
    };
  }, [plannedTasks, productiveHoursPerPerson, currentWarehouse.baseProductivity]);
  
  const equipmentStatus: EquipmentStatus[] = React.useMemo(() => {
    if (!plannedTasks) return [];
    const equipmentInUse: { [key: string]: number } = {};

    plannedTasks.forEach(task => {
      const productivityData = currentWarehouse.baseProductivity.find(p => p.id === task.productivityId);
      if (productivityData?.equipment) {
        for (const equipName in productivityData.equipment) {
          if (!equipmentInUse[equipName]) {
            equipmentInUse[equipName] = 0;
          }
          const requiredPerPerson = productivityData.equipment[equipName];
          equipmentInUse[equipName] += task.assignedStaff.length * requiredPerPerson;
        }
      }
    });

    return Object.keys(currentWarehouse.equipment).map(name => {
        const total = currentWarehouse.equipment[name];
        const inUse = equipmentInUse[name] || 0;
        return { name, total, inUse, available: total - inUse };
    });
}, [plannedTasks, currentWarehouse.baseProductivity, currentWarehouse.equipment]);


  React.useEffect(() => {
    const event = new CustomEvent('updateExportData', { 
        detail: {
            warehouse: currentWarehouse,
            stats,
            plannedTasks: analysisData.tasksWithData,
            analysisData,
            productiveHoursPerPerson,
            equipmentStatus
        }
    });
    window.dispatchEvent(event);
  }, [currentWarehouse, stats, analysisData, productiveHoursPerPerson, equipmentStatus]);

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6" id="main-dashboard-content">
      <Step1Settings
        settings={currentWarehouse}
        onUpdateSettings={handleUpdateSettings}
      />
      <StatsBar stats={stats} />
      <Separator />
      <Step2Tasks
        baseProductivity={currentWarehouse.baseProductivity}
        onAddTask={handleAddTask}
      />
       <Separator />
       <Step3StaffPool 
            staffInReserve={allPersonnelIcons}
            onDrop={handleDropOnReserve}
        />
      <Separator />
      <div>
            <div className="flex flex-col sm:flex-row gap-2 mb-4 justify-between items-center">
             <h3 className="text-lg font-bold tracking-tight">4. Tablero de Planificación y Asignación</h3>
             <div className="flex gap-2 flex-wrap justify-center sm:justify-end">
               <Button variant="outline" size="sm" onClick={handleOptimize}><Key className="mr-2 h-4 w-4" />Distribución Óptima</Button>
               <Button variant="outline" size="sm" onClick={handleUnassignAll}><Users className="mr-2 h-4 w-4" />Desasignar Personal</Button>
               <Button variant="destructive" size="sm" onClick={handleClearBoard}><Trash2 className="mr-2 h-4 w-4" />Limpiar Tablero</Button>
             </div>
           </div>
           <Step4PlannerBoard 
                tasks={plannedTasks || []}
                onDeleteTask={handleDeleteTask}
                onDropOnTask={handleDropOnTask}
                productiveHoursPerPerson={productiveHoursPerPerson}
                baseProductivity={currentWarehouse.baseProductivity}
                isLoading={isLoadingTasks}
                warehouse={currentWarehouse}
            />
        </div>
      <Separator />
       <Step5Analysis
          plannedTasks={plannedTasks || []}
          totalManHours={totalManHours}
          productiveHoursPerPerson={productiveHoursPerPerson}
          baseProductivity={currentWarehouse.baseProductivity}
          warehouse={currentWarehouse}
          equipmentStatus={equipmentStatus}
        />
    </div>
  );
}
