
"use client";

import * as React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";
import type { Warehouse } from "@/lib/types";

interface DeleteWarehouseDialogProps {
  warehouse: Warehouse;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string, password?: string) => boolean;
}

export function DeleteWarehouseDialog({ warehouse, isOpen, onClose, onConfirm }: DeleteWarehouseDialogProps) {
  const [password, setPassword] = React.useState("");
  const isProtected = !!warehouse.password;

  const handleConfirm = () => {
    if (onConfirm(warehouse.id, password)) {
        onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Está seguro de eliminar esta bodega?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Esto eliminará permanentemente la bodega "{warehouse.name}" y todos sus datos asociados.
            {isProtected && " Para confirmar, por favor ingrese el código de acceso de la bodega."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        {isProtected && (
            <div className="grid gap-4 py-4">
                <div className="flex items-center border rounded-md px-2 h-10">
                    <Key className="h-4 w-4 text-muted-foreground mr-2"/>
                    <Input
                        id="password"
                        type="password"
                        placeholder="Código de acceso"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoFocus
                    />
                </div>
            </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
