"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Productivity } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Step2TasksProps {
    baseProductivity: Productivity[];
    onAddTask: (productivityId: string, target: number) => void;
}

export function Step2Tasks({ baseProductivity, onAddTask }: Step2TasksProps) {
    const { toast } = useToast();
    const [selectedProductivity, setSelectedProductivity] = React.useState('');
    const [target, setTarget] = React.useState('');

    const handleAddTask = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProductivity || !target || Number(target) <= 0) {
            toast({
                variant: "destructive",
                title: "Datos incompletos",
                description: "Por favor, seleccione un proceso y un objetivo válido."
            });
            return;
        }
        onAddTask(selectedProductivity, Number(target));
        setSelectedProductivity('');
        setTarget('');
    };

    return (
        <div>
            <h3 className="text-lg font-bold tracking-tight mb-2">2. Añadir Tarea al Plan</h3>
            <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <CardContent className="p-4">
                    <form onSubmit={handleAddTask} className="flex flex-col sm:flex-row items-end gap-4">
                        <div className="flex-1 w-full sm:w-auto">
                            <Label htmlFor="process">Proceso</Label>
                             <Select value={selectedProductivity} onValueChange={setSelectedProductivity}>
                                <SelectTrigger id="process">
                                    <SelectValue placeholder="Seleccione un proceso" />
                                </SelectTrigger>
                                <SelectContent>
                                    {baseProductivity.length > 0 ? baseProductivity.map(p => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    )) : (
                                        <SelectItem value="none" disabled>No hay procesos configurados</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                            <Label htmlFor="target">Cantidad Objetivo</Label>
                            <Input 
                                id="target" 
                                type="number" 
                                placeholder="e.g., 5000" 
                                value={target}
                                onChange={(e) => setTarget(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Añadir Tarea
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
