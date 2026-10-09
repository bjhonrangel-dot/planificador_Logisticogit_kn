"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LockKeyhole } from "lucide-react";

interface AccessCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onUnlock: (password: string) => void;
  warehouseName: string;
}

export function AccessCodeDialog({
  isOpen,
  onClose,
  onUnlock,
  warehouseName,
}: AccessCodeDialogProps) {
  const [password, setPassword] = React.useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUnlock(password);
    setPassword("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="text-primary" />
              Bodega Protegida
            </DialogTitle>
            <DialogDescription>
              La bodega "{warehouseName}" está protegida. Por favor, ingrese el
              código de acceso para continuar.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <Input
              id="password"
              type="password"
              placeholder="Código de acceso"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit">Desbloquear</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
