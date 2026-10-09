
"use client";

import * as React from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { WarehouseSidebar } from "@/components/layout/sidebar";
import { MainDashboard } from "@/components/dashboard/main-dashboard";
import { AccessCodeDialog } from "@/components/access-code-dialog";
import { SettingsDialog } from "@/components/settings-dialog";
import type { Warehouse } from "@/lib/types";
import { DndProvider } from "@/contexts/dnd-context";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/layout/header";
import { useAuth, useCollection, useFirebase, useMemoFirebase } from "@/firebase";
import { initiateAnonymousSignIn } from "@/firebase/non-blocking-login";
import { collection, doc } from 'firebase/firestore';
import { addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { Loader2 } from "lucide-react";

export default function Home() {
  const { toast } = useToast();
  const { firestore, user, isUserLoading } = useFirebase();
  const auth = useAuth();

  const warehousesQuery = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'warehouses');
  }, [firestore, user]);

  const { data: warehouses, isLoading: isLoadingWarehouses } = useCollection<Warehouse>(warehousesQuery);
  
  const [selectedWarehouseId, setSelectedWarehouseId] = React.useState<string | null>(null);
  const [unlockedWarehouseIds, setUnlockedWarehouseIds] = React.useState<string[]>([]);
  const [isAccessCodeDialogOpen, setAccessCodeDialogOpen] = React.useState(false);
  const [isSettingsDialogOpen, setSettingsDialogOpen] = React.useState(false);
  
  React.useEffect(() => {
    if (!user && !isUserLoading) {
      initiateAnonymousSignIn(auth);
    }
  }, [user, isUserLoading, auth]);

  React.useEffect(() => {
    if (!selectedWarehouseId && warehouses && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [warehouses, selectedWarehouseId]);

  const activeWarehouse = React.useMemo(() => {
    if (!warehouses) return null;
    const warehouse = warehouses.find(w => w.id === selectedWarehouseId);
    if (!warehouse) return null;
    if (warehouse.password && !unlockedWarehouseIds.includes(warehouse.id)) {
      return null;
    }
    return warehouse;
  }, [warehouses, selectedWarehouseId, unlockedWarehouseIds]);

  const handleSelectWarehouse = (id: string) => {
    if (!warehouses) return;
    const warehouseToSelect = warehouses.find(w => w.id === id);

    if (warehouseToSelect?.password && !unlockedWarehouseIds.includes(id)) {
      setSelectedWarehouseId(id);
      setAccessCodeDialogOpen(true);
    } else {
      setSelectedWarehouseId(id);
    }
  };

  const handleUnlockWarehouse = (password: string) => {
    if (!warehouses) return;
    const warehouse = warehouses.find(w => w.id === selectedWarehouseId);
    if (warehouse?.password && btoa(password) === warehouse.password) {
      setUnlockedWarehouseIds(prev => [...prev, warehouse.id]);
      setAccessCodeDialogOpen(false);
      toast({ title: "Acceso concedido", description: `Bodega "${warehouse.name}" desbloqueada.` });
    } else {
      toast({ variant: "destructive", title: "Error de acceso", description: "El código de acceso es incorrecto." });
    }
  };
  
  const handleUpdateWarehouse = (updatedWarehouse: Warehouse) => {
    if (!firestore || !user) return;
    const warehouseRef = doc(firestore, 'warehouses', updatedWarehouse.id);
    updateDocumentNonBlocking(warehouseRef, { ...updatedWarehouse });
  };
  
  const handleSaveSettings = (updatedWarehouse: Warehouse) => {
    handleUpdateWarehouse(updatedWarehouse);
    toast({ title: "Configuración guardada", description: `La configuración de la bodega "${updatedWarehouse.name}" ha sido actualizada.` });
  };

  const handleAddNewWarehouse = (name: string) => {
    if (!firestore || !user) return;
    const newWarehouse: Omit<Warehouse, 'id'> = {
      name,
      shiftDate: new Date().toISOString(),
      shiftStartTime: "08:00",
      shiftEndTime: "17:00",
      totalStaff: 10,
      absentStaff: 1,
      breakTime: 15,
      lunchTime: 45,
      baseProductivity: [],
      equipment: {},
      personnelIcons: [
        { id: "p1", icon: "👷‍♂️" },
        { id: "p2", icon: "👷‍♀️" },
      ],
    };
    const warehousesCol = collection(firestore, 'warehouses');
    addDocumentNonBlocking(warehousesCol, newWarehouse).then(docRef => {
        if(docRef) {
            updateDocumentNonBlocking(docRef, { id: docRef.id });
            setSelectedWarehouseId(docRef.id);
        }
    }).catch(error => {
        console.error("Error creating warehouse:", error);
    });
  };
  
  const handleDeleteWarehouse = (id: string, passwordAttempt?: string) => {
    if (!firestore || !user || !warehouses) return;
    
    const warehouseToDelete = warehouses.find(w => w.id === id);
    if (!warehouseToDelete) return;

    if (warehouseToDelete.password) {
        if (!passwordAttempt || btoa(passwordAttempt) !== warehouseToDelete.password) {
            toast({ variant: "destructive", title: "Error de eliminación", description: "El código de acceso es incorrecto." });
            return false;
        }
    }

    const warehouseRef = doc(firestore, 'warehouses', id);
    deleteDocumentNonBlocking(warehouseRef);

    if (selectedWarehouseId === id) {
        const remaining = warehouses.filter(w => w.id !== id);
        setSelectedWarehouseId(remaining.length > 0 ? remaining[0].id : null);
    }
    toast({ title: "Bodega eliminada", description: `La bodega "${warehouseToDelete.name}" ha sido eliminada.` });
    return true;
  };

  if (isUserLoading || isLoadingWarehouses) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
        <p className="text-muted-foreground">Cargando bodegas...</p>
      </div>
    )
  }

  return (
    <DndProvider>
      <SidebarProvider>
        <WarehouseSidebar
          warehouses={warehouses || []}
          selectedWarehouseId={selectedWarehouseId}
          unlockedWarehouseIds={unlockedWarehouseIds}
          onSelectWarehouse={handleSelectWarehouse}
          onAddWarehouse={handleAddNewWarehouse}
          onDeleteWarehouse={handleDeleteWarehouse}
        />
        <main className="flex-1 flex flex-col h-screen">
            <AppHeader
              warehouseName={activeWarehouse?.name || warehouses?.find(w => w.id === selectedWarehouseId)?.name}
              onOpenSettings={() => setSettingsDialogOpen(true)}
              activeWarehouse={activeWarehouse}
            />
            <div className="flex-1 overflow-y-auto bg-background">
                {activeWarehouse ? (
                  <MainDashboard 
                    key={activeWarehouse.id} 
                    warehouse={activeWarehouse}
                    onUpdateWarehouse={handleUpdateWarehouse}
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4 text-center">
                    {warehouses && warehouses.length > 0
                      ? (warehouses.find(w => w.id === selectedWarehouseId)?.password 
                          ? "Seleccione una bodega o ingrese el código de acceso para ver los detalles." 
                          : "Seleccione una bodega para comenzar a planificar.")
                      : "Cree una nueva bodega para comenzar."}
                  </div>
                )}
            </div>
        </main>
        <AccessCodeDialog
          isOpen={isAccessCodeDialogOpen}
          onClose={() => setAccessCodeDialogOpen(false)}
          onUnlock={handleUnlockWarehouse}
          warehouseName={warehouses?.find(w => w.id === selectedWarehouseId)?.name || ""}
        />
        {activeWarehouse && selectedWarehouseId && warehouses?.find(w => w.id === selectedWarehouseId) && (
            <SettingsDialog
              isOpen={isSettingsDialogOpen}
              onClose={() => setSettingsDialogOpen(false)}
              warehouse={warehouses.find(w => w.id === selectedWarehouseId)!}
              onSave={handleSaveSettings}
              onUpdate={handleUpdateWarehouse}
            />
        )}
      </SidebarProvider>
    </DndProvider>
  );
}
