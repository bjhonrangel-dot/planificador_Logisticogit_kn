
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
import { Label } from "@/components/ui/label";
import type { Warehouse, Productivity } from "@/lib/types";
import { Trash2, PlusCircle } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Checkbox } from "./ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "./ui/separator";

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  warehouse: Warehouse;
  onSave: (warehouse: Warehouse) => void;
  onUpdate: (warehouse: Warehouse) => void;
}

const allIcons = ['👷‍♂️', '👷‍♀️', '👨‍🔧', '👩‍🔧', '👨‍🏭', '👩‍🏭', '🏃‍♂️', '🏃‍♀️', '💪', '📦'];

export function SettingsDialog({ isOpen, onClose, warehouse, onSave, onUpdate }: SettingsDialogProps) {
    const { toast } = useToast();
    const [password, setPassword] = React.useState("");
    const [confirmPassword, setConfirmPassword] = React.useState("");
    const [isPasswordModified, setIsPasswordModified] = React.useState(false);

    const [newProductivity, setNewProductivity] = React.useState({ group: "", name: "", unitOfMeasure: "", productivity: "" });
    const [newEquipment, setNewEquipment] = React.useState({ name: "", quantity: "0" });
    
    React.useEffect(() => {
        if (isOpen) {
            let initialPassword = "";
            if (warehouse.password) {
                try {
                    initialPassword = atob(warehouse.password);
                } catch (e) {
                    console.error("Failed to decode warehouse password:", e);
                    initialPassword = ""; 
                }
            }
            setPassword(initialPassword);
            setConfirmPassword(initialPassword);
            setIsPasswordModified(false);
        }
    }, [isOpen, warehouse.id, warehouse.password]);
    
    const handleSaveChanges = () => {
        if (isPasswordModified && password !== confirmPassword) {
            toast({ variant: "destructive", title: "Error", description: "Las contraseñas no coinciden." });
            return;
        }

        const finalWarehouse = { ...warehouse };
        if (isPasswordModified) {
            finalWarehouse.password = password ? btoa(password) : undefined;
        }
        
        onSave(finalWarehouse);
        onClose();
    };

    const handleUpdate = (updatedWarehouse: Warehouse) => {
      onUpdate(updatedWarehouse);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        handleUpdate({ ...warehouse, [name]: type === 'number' ? Number(value) : value });
    };

    const handleIconChange = (icon: string, checked: boolean) => {
        const currentIcons = warehouse.personnelIcons.map(i => i.icon);
        let newIcons;
        if (checked) {
            newIcons = [...currentIcons, icon];
        } else {
            newIcons = currentIcons.filter(i => i !== icon);
        }

        if (newIcons.length === 0) {
            toast({ variant: "destructive", title: "Error", description: "Debe seleccionar al menos un ícono." });
            return;
        }

        const newPersonnelIcons = newIcons.map((ico, index) => ({ id: `p${index + 1}`, icon: ico }));
        handleUpdate({ ...warehouse, personnelIcons: newPersonnelIcons });
    };

    const handleProdChange = (prodId: string, field: keyof Omit<Productivity, 'id' | 'equipment'>, value: any) => {
        handleUpdate({
            ...warehouse,
            baseProductivity: warehouse.baseProductivity.map(p => 
                p.id === prodId ? { ...p, [field]: value } : p
            )
        });
    };
    
    const handleAddProductivity = () => {
        if (newProductivity.name && newProductivity.productivity) {
            const newProd: Productivity = {
                id: `prod-${Date.now()}`,
                group: newProductivity.group,
                name: newProductivity.name,
                unitOfMeasure: newProductivity.unitOfMeasure || 'unidades',
                productivity: Number(newProductivity.productivity),
            };
            handleUpdate({ ...warehouse, baseProductivity: [...warehouse.baseProductivity, newProd] });
            setNewProductivity({ group: "", name: "", unitOfMeasure: "", productivity: "" });
        } else {
            toast({ variant: "destructive", title: "Datos incompletos", description: "El nombre del proceso y la productividad son requeridos." });
        }
    };
    
    const handleDeleteProductivity = (id: string) => {
        handleUpdate({ ...warehouse, baseProductivity: warehouse.baseProductivity.filter(p => p.id !== id) });
    };
    
    const handleProdEquipReqChange = (prodId: string, oldEquipName: string, newEquipName: string) => {
        handleUpdate({
            ...warehouse,
            baseProductivity: warehouse.baseProductivity.map(p => {
                if (p.id === prodId && p.equipment) {
                    const newEquip = {...p.equipment};
                    if (oldEquipName in newEquip) {
                        const quantity = newEquip[oldEquipName];
                        delete newEquip[oldEquipName];
                        newEquip[newEquipName] = quantity;
                        return { ...p, equipment: newEquip };
                    }
                }
                return p;
            })
        });
    };
    
    const handleProdEquipQuantityChange = (prodId: string, equipName: string, quantity: number) => {
        handleUpdate({
            ...warehouse,
            baseProductivity: warehouse.baseProductivity.map(p => {
                if (p.id === prodId && p.equipment) {
                     const newEquip = {...p.equipment};
                     newEquip[equipName] = quantity >= 1 ? quantity : 1;
                     return { ...p, equipment: newEquip };
                }
                return p;
            })
        });
    }

    const addEquipamientoReq = (prodId: string) => {
        const firstEquip = Object.keys(warehouse.equipment)[0];
        if (!firstEquip) {
            toast({ variant: "destructive", title: "Error", description: "No hay equipamiento disponible para añadir." });
            return;
        }
        
        handleUpdate({
            ...warehouse,
            baseProductivity: warehouse.baseProductivity.map(p => {
                if (p.id === prodId) {
                    const newEquipmentReq = { ...(p.equipment || {}) };
                    if (!Object.keys(newEquipmentReq).includes(firstEquip)) {
                         newEquipmentReq[firstEquip] = 1;
                    }
                    return { ...p, equipment: newEquipmentReq };
                }
                return p;
            })
        });
    };

    const removeEquipamientoReq = (prodId: string, equipName: string) => {
        handleUpdate({
            ...warehouse,
            baseProductivity: warehouse.baseProductivity.map(p => {
                if (p.id === prodId && p.equipment) {
                    const newEquip = {...p.equipment};
                    delete newEquip[equipName];
                    return { ...p, equipment: newEquip };
                }
                return p;
            })
        });
    };

    const handleEquipNameChange = (oldName: string, newName: string) => {
        if (!newName || oldName === newName) return;
        
        const newEquipment = { ...warehouse.equipment };
        if (newName in newEquipment) {
            toast({ variant: "destructive", title: "Error", description: "El nombre del equipo ya existe." });
            return;
        }
        const value = newEquipment[oldName];
        delete newEquipment[oldName];
        newEquipment[newName] = value;

        const newBaseProductivity = warehouse.baseProductivity.map(prod => {
            if(prod.equipment && oldName in prod.equipment) {
                const newProdEquipment = {...prod.equipment};
                const equipValue = newProdEquipment[oldName];
                delete newProdEquipment[oldName];
                newProdEquipment[newName] = equipValue;
                return {...prod, equipment: newProdEquipment};
            }
            return prod;
        });

        handleUpdate({ ...warehouse, equipment: newEquipment, baseProductivity: newBaseProductivity });
    };

    const handleEquipQuantityChange = (name: string, quantity: number) => {
        handleUpdate({
            ...warehouse,
            equipment: { ...warehouse.equipment, [name]: quantity >= 0 ? quantity : 0 },
        });
    };

    const handleAddEquipment = () => {
        if (newEquipment.name) {
            if(newEquipment.name in warehouse.equipment) {
                toast({ variant: "destructive", title: "Error", description: "El nombre del equipo ya existe." });
                return;
            }
            handleUpdate({
                ...warehouse,
                equipment: { ...warehouse.equipment, [newEquipment.name]: Number(newEquipment.quantity) || 0 },
            });
            setNewEquipment({ name: "", quantity: "0" });
        } else {
             toast({ variant: "destructive", title: "Error", description: "Debe ingresar un nombre para el equipo." });
        }
    };
    
    const handleDeleteEquipment = (name: string) => {
        const newEquip = { ...warehouse.equipment };
        delete newEquip[name];

        const newBaseProductivity = warehouse.baseProductivity.map(prod => {
            if(prod.equipment && name in prod.equipment) {
                const newProdEquipment = {...prod.equipment};
                delete newProdEquipment[name];
                return {...prod, equipment: newProdEquipment};
            }
            return prod;
        });
        handleUpdate({ ...warehouse, equipment: newEquip, baseProductivity: newBaseProductivity });
    };

    if (!warehouse) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-4xl h-full sm:h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Configuración - {warehouse.name}</DialogTitle>
                    <DialogDescription>
                        Ajustes para "{warehouse.name}". Los cambios se aplicarán en tiempo real al planificador.
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-grow pr-6 -mr-6">
                    <div className="space-y-6 py-4">
                        
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Información General</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label htmlFor="name">Nombre de la Bodega</Label>
                                    <Input id="name" name="name" value={warehouse.name} onChange={handleInputChange} />
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader><CardTitle className="text-lg">Seguridad</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="password">Código de Acceso (Opcional)</Label>
                                        <Input id="password" type="password" placeholder="Dejar en blanco para sin contraseña" value={password} onChange={(e) => { setPassword(e.target.value); setIsPasswordModified(true); }} />
                                    </div>
                                    {(isPasswordModified || password) && (
                                         <div>
                                            <Label htmlFor="confirmPassword">Confirmar Código</Label>
                                            <Input id="confirmPassword" type="password" placeholder="Repetir código" value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setIsPasswordModified(true); }} />
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Iconos del Personal</CardTitle>
                                <DialogDescription>Seleccione los iconos que aparecerán en la reserva de personal.</DialogDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-4">
                                {allIcons.map(icon => (
                                    <div key={icon} className="flex items-center gap-2">
                                        <Checkbox
                                            id={`icon-${icon}`}
                                            checked={warehouse.personnelIcons.some(i => i.icon === icon)}
                                            onCheckedChange={(checked) => handleIconChange(icon, !!checked)}
                                        />
                                        <label htmlFor={`icon-${icon}`} className="text-2xl cursor-pointer">{icon}</label>
                                    </div>
                                ))}
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <Card>
                                <CardHeader><CardTitle className="text-lg">Tiempos de Descanso (minutos)</CardTitle></CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="breakTime">Break / Pausa activa</Label>
                                        <Input id="breakTime" name="breakTime" type="number" value={warehouse.breakTime} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <Label htmlFor="lunchTime">Almuerzo</Label>
                                        <Input id="lunchTime" name="lunchTime" type="number" value={warehouse.lunchTime} onChange={handleInputChange} />
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-lg">Disponibilidad de Equipamiento</CardTitle></CardHeader>
                                <CardContent>
                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                                        {Object.keys(warehouse.equipment).length > 0 ? Object.entries(warehouse.equipment).map(([name, quantity]) => (
                                            <div key={name} className="flex items-center gap-2">
                                                <Input 
                                                    defaultValue={name} 
                                                    className="flex-1"
                                                    onBlur={(e) => handleEquipNameChange(name, e.target.value)}
                                                />
                                                <Input 
                                                    type="number" 
                                                    value={quantity}
                                                    className="w-24"
                                                    onChange={(e) => handleEquipQuantityChange(name, Number(e.target.value))}
                                                />
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteEquipment(name)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        )) : <p className="text-sm text-muted-foreground text-center py-4">No hay equipamiento definido.</p>}
                                    </div>
                                    <Separator className="my-4" />
                                    <div className="flex gap-2 items-end">
                                        <div className="flex-1">
                                            <Label htmlFor="new-equip-name">Nombre Equipo</Label>
                                            <Input id="new-equip-name" placeholder="Nuevo equipo" value={newEquipment.name} onChange={(e) => setNewEquipment(p => ({...p, name: e.target.value}))}/>
                                        </div>
                                         <div className="w-24">
                                            <Label htmlFor="new-equip-qty">Cant.</Label>
                                            <Input id="new-equip-qty" type="number" value={newEquipment.quantity} onChange={(e) => setNewEquipment(p => ({...p, quantity: e.target.value}))}/>
                                        </div>
                                        <Button onClick={handleAddEquipment} size="icon"><PlusCircle className="h-5 w-5"/></Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Productividades Base</CardTitle>
                                <DialogDescription>Plantillas de procesos estándar y su rendimiento esperado.</DialogDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="hidden md:grid md:grid-cols-[1fr,1.5fr,1fr,1fr,1.5fr,auto] gap-4 items-center text-sm font-medium text-muted-foreground px-2">
                                    <span>Grupo</span>
                                    <span>Proceso</span>
                                    <span>Unidad Medida</span>
                                    <span>Prod/Hr</span>
                                    <span>Equipamiento Requerido</span>
                                    <span>Acción</span>
                                </div>
                                <div className="space-y-4">
                                    {warehouse.baseProductivity.map((prod) => (
                                        <Card key={prod.id} className="p-4">
                                            <div className="grid grid-cols-2 md:grid-cols-[1fr,1.5fr,1fr,1fr,1.5fr,auto] gap-4 items-start">
                                                <div className="space-y-1">
                                                    <Label className="md:hidden">Grupo</Label>
                                                    <Input placeholder="Ej: Inbound" value={prod.group || ''} onChange={(e) => handleProdChange(prod.id, 'group', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="md:hidden">Proceso</Label>
                                                    <Input placeholder="Nombre Proceso" value={prod.name} onChange={(e) => handleProdChange(prod.id, 'name', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="md:hidden">Unidad Medida</Label>
                                                    <Input placeholder="unidades" value={prod.unitOfMeasure || 'unidades'} onChange={(e) => handleProdChange(prod.id, 'unitOfMeasure', e.target.value)} />
                                                </div>
                                                <div className="space-y-1">
                                                    <Label className="md:hidden">Prod/Hr</Label>
                                                    <Input type="number" placeholder="Ej: 100" value={prod.productivity} onChange={(e) => handleProdChange(prod.id, 'productivity', Number(e.target.value))} />
                                                </div>
                                                <div className="space-y-2">
                                                     <Label className="md:hidden">Equipamiento Requerido</Label>
                                                    {prod.equipment && Object.entries(prod.equipment).map(([key, value]) => (
                                                      <div key={key} className="flex items-center gap-2">
                                                        <Select defaultValue={key} onValueChange={(newKey: string) => handleProdEquipReqChange(prod.id, key, newKey)}>
                                                            <SelectTrigger>
                                                                <SelectValue/>
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {Object.keys(warehouse.equipment).map(eq => <SelectItem key={eq} value={eq}>{eq}</SelectItem>)}
                                                            </SelectContent>
                                                        </Select>
                                                         <Input type="number" value={value} min="1" className="w-16" onChange={(e) => handleProdEquipQuantityChange(prod.id, key, Number(e.target.value))} />
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => removeEquipamientoReq(prod.id, key)}><Trash2 className="h-4 w-4 text-destructive"/></Button>
                                                      </div>
                                                    ))}
                                                    <Button variant="outline" size="sm" className="w-full" onClick={() => addEquipamientoReq(prod.id)}>Añadir Equipo</Button>
                                                </div>
                                                <div className="flex justify-end md:justify-center items-start col-span-2 md:col-span-1">
                                                     <Label className="md:hidden mr-2">Acción</Label>
                                                    <Button variant="ghost" size="icon" className="ml-2 flex-shrink-0" onClick={() => handleDeleteProductivity(prod.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>
                                <Separator className="my-6" />
                                <div>
                                    <h4 className="font-medium mb-2">Añadir Nueva Productividad</h4>
                                    <div className="grid grid-cols-2 sm:grid-cols-[1fr,1.5fr,1fr,1fr,auto] gap-2 items-end">
                                         <div className="flex-1 w-full col-span-2 sm:col-span-1">
                                            <Label>Grupo</Label>
                                            <Input placeholder="Ej: Picking" value={newProductivity.group} onChange={(e) => setNewProductivity(p => ({...p, group: e.target.value}))}/>
                                        </div>
                                        <div className="flex-1 w-full col-span-2 sm:col-span-1">
                                            <Label>Proceso</Label>
                                            <Input placeholder="Ej: Maquila Especial" value={newProductivity.name} onChange={(e) => setNewProductivity(p => ({...p, name: e.target.value}))}/>
                                        </div>
                                        <div className="flex-1 w-full">
                                            <Label>Unidad Medida</Label>
                                            <Input placeholder="unidades" value={newProductivity.unitOfMeasure} onChange={(e) => setNewProductivity(p => ({...p, unitOfMeasure: e.target.value}))}/>
                                        </div>
                                        <div className="w-full sm:w-28">
                                            <Label>Prod/Hr</Label>
                                            <Input type="number" placeholder="0" value={newProductivity.productivity} onChange={(e) => setNewProductivity(p => ({...p, productivity: e.target.value}))}/>
                                        </div>
                                        <Button onClick={handleAddProductivity} size="icon" className="w-full sm:w-10 h-10 col-span-2 sm:col-span-1"><PlusCircle className="h-5 w-5"/></Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
                
                <DialogFooter className="pt-4 flex-shrink-0 border-t bg-background">
                    <Button type="button" variant="outline" onClick={onClose}>Cerrar</Button>
                    <Button type="button" onClick={handleSaveChanges}>Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
