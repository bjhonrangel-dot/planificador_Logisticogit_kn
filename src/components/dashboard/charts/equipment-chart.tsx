
"use client"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import type { EquipmentStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function EquipmentAvailabilityChart({ equipmentStatus }: { equipmentStatus: EquipmentStatus[] }) {
  if (equipmentStatus.length === 0) {
    return (
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardHeader>
                <CardTitle>Disponibilidad de Equipamiento</CardTitle>
                <CardDescription>No hay equipamiento configurado para esta bodega.</CardDescription>
            </CardHeader>
             <CardContent>
                <p className="text-sm text-muted-foreground text-center py-4">Añada equipos en la configuración de la bodega.</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Disponibilidad de Equipamiento</CardTitle>
        <CardDescription>Resumen del uso y disponibilidad del equipamiento para el turno actual.</CardDescription>
      </CardHeader>
      <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Equipo</TableHead>
            <TableHead className="text-center">Total</TableHead>
            <TableHead className="text-center">En Uso</TableHead>
            <TableHead className="text-center">Disponible</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {equipmentStatus.map((item) => (
            <TableRow key={item.name}>
              <TableCell className="font-medium">{item.name}</TableCell>
              <TableCell className="text-center">{item.total}</TableCell>
              <TableCell className="text-center">{item.inUse}</TableCell>
              <TableCell className={cn("text-center font-bold", item.available < 0 ? "text-destructive" : "text-green-600")}>
                {item.available}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </CardContent>
    </Card>
  )
}
