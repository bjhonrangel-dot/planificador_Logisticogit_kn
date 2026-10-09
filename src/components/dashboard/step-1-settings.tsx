
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { Warehouse } from "@/lib/types";
import { Calendar, Watch, User, UserMinus } from 'lucide-react';

interface Step1SettingsProps {
  settings: Pick<
    Warehouse,
    | "shiftDate"
    | "shiftStartTime"
    | "shiftEndTime"
    | "totalStaff"
    | "absentStaff"
  >;
  onUpdateSettings: (
    newSettings: Partial<
      Pick<
        Warehouse,
        | "shiftDate"
        | "shiftStartTime"
        | "shiftEndTime"
        | "totalStaff"
        | "absentStaff"
      >
    >
  ) => void;
}

export function Step1Settings({ settings, onUpdateSettings }: Step1SettingsProps) {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        onUpdateSettings({
          [name]: type === 'number' ? Number(value) : value,
        });
      };

  return (
    <div>
        <h3 className="text-lg font-bold tracking-tight mb-2">1. Configuración de Turno y Personal</h3>
        <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <CardContent className="p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="space-y-1">
                        <Label htmlFor="shiftDate">Fecha del Turno</Label>
                        <div className="flex items-center border rounded-md px-2 h-10">
                            <Calendar className="h-4 w-4 text-muted-foreground mr-2"/>
                            <Input id="shiftDate" name="shiftDate" type="date" className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" value={settings.shiftDate.slice(0, 10)} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="shiftStartTime">Hora Inicio</Label>
                         <div className="flex items-center border rounded-md px-2 h-10">
                             <Watch className="h-4 w-4 text-muted-foreground mr-2"/>
                             <Input id="shiftStartTime" name="shiftStartTime" type="time" className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" value={settings.shiftStartTime} onChange={handleInputChange} />
                         </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="shiftEndTime">Hora Fin</Label>
                        <div className="flex items-center border rounded-md px-2 h-10">
                            <Watch className="h-4 w-4 text-muted-foreground mr-2"/>
                            <Input id="shiftEndTime" name="shiftEndTime" type="time" className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" value={settings.shiftEndTime} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="totalStaff">Personal Total</Label>
                        <div className="flex items-center border rounded-md px-2 h-10">
                            <User className="h-4 w-4 text-muted-foreground mr-2"/>
                            <Input id="totalStaff" name="totalStaff" type="number" min="0" className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" value={settings.totalStaff} onChange={handleInputChange} />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor="absentStaff">Personal Ausente</Label>
                         <div className="flex items-center border rounded-md px-2 h-10">
                            <UserMinus className="h-4 w-4 text-muted-foreground mr-2"/>
                            <Input id="absentStaff" name="absentStaff" type="number" min="0" className="border-0 p-0 h-auto focus-visible:ring-0 bg-transparent" value={settings.absentStaff} onChange={handleInputChange} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
