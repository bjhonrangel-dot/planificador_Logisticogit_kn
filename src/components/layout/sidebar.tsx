
"use client";

import * as React from "react";
import Image from "next/image";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Warehouse } from "@/lib/types";
import { Lock, Plus, Trash2, Unlock } from "lucide-react";
import { DeleteWarehouseDialog } from "@/components/delete-warehouse-dialog";

interface WarehouseSidebarProps {
  warehouses: Warehouse[];
  selectedWarehouseId: string | null;
  unlockedWarehouseIds: string[];
  onSelectWarehouse: (id: string) => void;
  onAddWarehouse: (name: string) => void;
  onDeleteWarehouse: (id: string, password?: string) => boolean;
}

export function WarehouseSidebar({
  warehouses,
  selectedWarehouseId,
  unlockedWarehouseIds,
  onSelectWarehouse,
  onAddWarehouse,
  onDeleteWarehouse,
}: WarehouseSidebarProps) {
    const [newWarehouseName, setNewWarehouseName] = React.useState("");
    const [warehouseToDelete, setWarehouseToDelete] = React.useState<Warehouse | null>(null);
    const scrollAreaRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if(scrollAreaRef.current) {
            scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }
    }, [warehouses.length]);

    const handleAddWarehouse = () => {
        if(newWarehouseName.trim()) {
            onAddWarehouse(newWarehouseName.trim());
            setNewWarehouseName("");
        }
    }

  return (
    <>
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="h-8 w-8 rounded-md" />
            <h2 className="text-xl font-semibold text-sidebar-foreground">Bodegas</h2>
        </div>
      </SidebarHeader>
      <SidebarContent ref={scrollAreaRef} className="p-2">
        <SidebarMenu>
          {warehouses.map((warehouse) => {
            const isLocked = warehouse.password && !unlockedWarehouseIds.includes(warehouse.id);
            return (
              <SidebarMenuItem key={warehouse.id} className="group/item">
                <SidebarMenuButton
                  isActive={warehouse.id === selectedWarehouseId}
                  onClick={() => onSelectWarehouse(warehouse.id)}
                  className="w-full justify-start"
                >
                  {isLocked ? <Lock className="h-4 w-4" /> : warehouse.password ? <Unlock className="h-4 w-4" /> : <div className="w-4" />}
                  <span className="flex-1 truncate">{warehouse.name}</span>
                </SidebarMenuButton>

                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute right-1 top-1.5 h-6 w-6 opacity-0 group-hover/item:opacity-100 focus:opacity-100"
                    onClick={() => setWarehouseToDelete(warehouse)}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex gap-2">
          <Input 
            placeholder="Nueva bodega..." 
            value={newWarehouseName}
            onChange={(e) => setNewWarehouseName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddWarehouse()}
            className="bg-sidebar-background focus:bg-white text-sidebar-foreground focus:text-foreground"
          />
          <Button variant="outline" size="icon" onClick={handleAddWarehouse}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
         <div className="text-xs text-center text-sidebar-foreground/50 mt-4 px-2">
          <p>Desarrollado por IS Local Jhon Rangel</p>
          <p>jhon.rangel@kuehne-nagel.com</p>
        </div>
      </SidebarFooter>
    </Sidebar>
    {warehouseToDelete && (
        <DeleteWarehouseDialog
            warehouse={warehouseToDelete}
            isOpen={!!warehouseToDelete}
            onClose={() => setWarehouseToDelete(null)}
            onConfirm={onDeleteWarehouse}
        />
    )}
    </>
  );
}
