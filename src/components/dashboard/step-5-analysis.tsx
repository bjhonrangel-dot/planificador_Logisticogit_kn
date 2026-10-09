
"use client";

import * as React from "react";
import { differenceInMinutes } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ComplianceChart } from "./charts/compliance-chart";
import { WorkloadChart } from "./charts/workload-chart";
import { CapacityChart } from "./charts/capacity-chart";
import { EquipmentAvailabilityChart } from "./charts/equipment-chart";
import type { PlannedTask, Productivity, AnalyzePlanFeasibilityOutput, Warehouse, EquipmentStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, Lightbulb, Loader2, UserPlus, Clock } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";


interface Step5AnalysisProps {
    plannedTasks: PlannedTask[];
    totalManHours: number;
    productiveHoursPerPerson: number;
    baseProductivity: Productivity[];
    warehouse: Warehouse;
    equipmentStatus: EquipmentStatus[];
}

export function Step5Analysis({ plannedTasks, totalManHours, productiveHoursPerPerson, baseProductivity, warehouse, equipmentStatus }: Step5AnalysisProps) {
    const [activeTab, setActiveTab] = React.useState("dashboard");
    const [analysisResult, setAnalysisResult] = React.useState<AnalyzePlanFeasibilityOutput | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const chartData = React.useMemo(() => {
        if (!plannedTasks || plannedTasks.length === 0) {
            return {
                tasksWithData: [],
                overallCompliance: 0,
                totalTarget: 0,
                totalCapacity: 0,
            };
        }

        const tasksWithData = plannedTasks.map(task => {
            const productivityData = baseProductivity.find(p => p.id === task.productivityId);
            const productivityPerHour = productivityData?.productivity || 0;
            const capacityAchieved = task.assignedStaff.length * productiveHoursPerPerson * productivityPerHour;
            return { ...task, capacityAchieved, target: task.target, name: task.name, productivityPerHour };
        });

        const totalTarget = tasksWithData.reduce((acc, task) => acc + task.target, 0);
        
        const totalAchievedCapacity = tasksWithData.reduce((acc, task) => {
            const cappedCapacity = Math.min(task.capacityAchieved, task.target);
            return acc + cappedCapacity;
        }, 0);

        const overallCompliance = totalTarget > 0 ? (totalAchievedCapacity / totalTarget) * 100 : 0;

        const totalPotentialCapacity = tasksWithData.reduce((acc, task) => acc + task.capacityAchieved, 0);

        return {
            tasksWithData,
            overallCompliance,
            totalTarget,
            totalCapacity: totalPotentialCapacity
        };
    }, [plannedTasks, productiveHoursPerPerson, baseProductivity]);

    const handleAnalyze = () => {
        setIsLoading(true);
        setAnalysisResult(null);

        // This is a local simulation. For a real AI, you'd make an API call here.
        setTimeout(() => {
            const shiftStart = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftStartTime}`);
            const shiftEnd = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftEndTime}`);
            if (shiftEnd <= shiftStart) shiftEnd.setDate(shiftEnd.getDate() + 1);

            const totalShiftMinutes = differenceInMinutes(shiftEnd, shiftStart);
            const totalBreakMinutes = warehouse.breakTime + warehouse.lunchTime;
            const productiveMinutesPerPerson = totalShiftMinutes - totalBreakMinutes;
            const efficiencyRatio = totalShiftMinutes > 0 ? productiveMinutesPerPerson / totalShiftMinutes : 0;
            const shiftEndTimeString = shiftEnd.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
            
            const tasksWithTime = chartData.tasksWithData.map(task => {
                let completionTime = "N/A";
                let finishesOnTime = false;
                let completionDateObj: Date | null = null;
                let doesNotFinish = false;

                if (efficiencyRatio > 0 && task.assignedStaff.length > 0 && task.productivityPerHour > 0) {
                    const totalProductivityPerHour = task.assignedStaff.length * task.productivityPerHour;
                    const productiveHoursToComplete = task.target / totalProductivityPerHour;
                    const wallClockMinutesToComplete = (productiveHoursToComplete * 60) / efficiencyRatio;
                    const completionDate = new Date(shiftStart.getTime() + wallClockMinutesToComplete * 60 * 1000);
                    
                    completionTime = completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
                    completionDateObj = completionDate;
                    if (completionDate <= shiftEnd) {
                        finishesOnTime = true;
                    }
                } else if (task.target > 0) {
                    doesNotFinish = true; // Does not finish because no one is assigned
                }
                
                return { ...task, completionTime, finishesOnTime, completionDateObj, doesNotFinish };
            });
            
            const surplusTasks = tasksWithTime.filter(t => t.capacityAchieved >= t.target);
            const deficitTasks = tasksWithTime.filter(t => t.capacityAchieved < t.target);

            const improvementSuggestions: string[] = [];
            const criticalPoints: string[] = [];
            
            deficitTasks.forEach(task => {
                const deficit = Math.abs(task.capacityAchieved - task.target);
                let point = `**Tarea "${task.name}":** Déficit de **${Math.round(deficit).toLocaleString()} ${task.unitOfMeasure || 'unidades'}**.`;
                
                if (task.doesNotFinish) {
                    point += " No tiene personal asignado.";
                } else if (!task.finishesOnTime) {
                    point += ` No se completa antes del fin del turno (${shiftEndTimeString}).`;
                }
                criticalPoints.push(point);
                
                if (productiveHoursPerPerson > 0 && task.productivityPerHour > 0) {
                    const unitsPerPerson = productiveHoursPerPerson * task.productivityPerHour;
                    const peopleNeeded = Math.ceil(deficit / unitsPerPerson);
                    improvementSuggestions.push(`**Falta Personal:** Para cumplir el objetivo de "${task.name}", considere asignar **${peopleNeeded} persona(s) más**.`);
                }
            });

            surplusTasks.sort((a, b) => (a.completionDateObj?.getTime() || Infinity) - (b.completionDateObj?.getTime() || Infinity));

            surplusTasks.forEach(task => {
                const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && task.productivityPerHour > 0)
                    ? Math.ceil(task.target / (task.productivityPerHour * productiveHoursPerPerson)) : 0;
                const surplusStaff = task.assignedStaff.length - theoreticalStaffNeeded;
                
                let point = `**Tarea "${task.name}":** Cumple su objetivo.`;
                if (task.finishesOnTime) {
                    point += ` Finaliza a las **${task.completionTime}**.`;
                }
                
                criticalPoints.push(point);

                if (surplusStaff > 0 && deficitTasks.length > 0) {
                    improvementSuggestions.push(`**Reasignación Inmediata:** Mueva **${surplusStaff} persona(s)** de "${task.name}" a tareas con déficit para optimizar el plan.`);
                } else if (task.finishesOnTime && deficitTasks.length > 0) {
                    improvementSuggestions.push(`**Reasignación Programada:** El equipo de **"${task.name}"** (${task.assignedStaff.length} personas) se liberará a las **${task.completionTime}**. A partir de esa hora, pueden ser reasignados a tareas con déficit.`);
                }
            });

            let isFeasible = deficitTasks.length === 0;
            if (isFeasible && chartData.tasksWithData.length > 0) {
                if (improvementSuggestions.length === 0) {
                    improvementSuggestions.push("¡Excelente planificación! Todos los objetivos se cumplen. Considere reasignar el personal excedente para optimizar costos.");
                }
            } else if (chartData.tasksWithData.length === 0) {
                isFeasible = false;
                criticalPoints.push("No hay tareas en el plan para analizar.");
            }
            
            setAnalysisResult({
                isFeasible,
                overallDiagnosis: isFeasible ? "Cumple" : "Incumple",
                criticalPoints,
                improvementSuggestions,
            });

            setIsLoading(false);
        }, 500);
    };


    return (
        <div id="analysis-section">
            <h3 className="text-lg font-bold tracking-tight mb-2">5. Análisis y Desempeño</h3>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2">
                    <TabsTrigger value="dashboard">Dashboards</TabsTrigger>
                    <TabsTrigger value="analysis">Análisis de Mejora</TabsTrigger>
                </TabsList>
                <TabsContent value="dashboard">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
                        <div className="lg:col-span-1">
                            <ComplianceChart compliance={chartData.overallCompliance} />
                        </div>
                        <div className="lg:col-span-2">
                           <CapacityChart data={chartData.tasksWithData.map(d => ({name: d.name, target: d.target, capacityAchieved: d.capacityAchieved}))} />
                        </div>
                         <div className="lg:col-span-3">
                           <WorkloadChart data={chartData.tasksWithData} />
                        </div>
                        <div className="lg:col-span-3">
                           <EquipmentAvailabilityChart equipmentStatus={equipmentStatus} />
                        </div>
                    </div>
                </TabsContent>
                <TabsContent value="analysis">
                    <Card className="mt-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                        <CardHeader>
                            <CardTitle>Análisis de Viabilidad del Plan</CardTitle>
                            <CardDescription>
                                Obtenga un diagnóstico inmediato sobre la factibilidad del plan y reciba sugerencias de mejora.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleAnalyze} disabled={isLoading || plannedTasks.length === 0}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
                                Analizar Plan Actual
                            </Button>
                            
                            {isLoading && (
                                <div className="mt-6 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                    <p className="ml-4 text-muted-foreground">Analizando el plan, por favor espere...</p>
                                </div>
                            )}

                            {analysisResult && (
                                <div className="mt-6 space-y-6">
                                    <Alert variant={analysisResult.isFeasible ? "default" : "destructive"} className={analysisResult.isFeasible ? "bg-green-100/80 border-green-300 text-green-800" : ""}>
                                        {analysisResult.isFeasible ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4" />}
                                        <AlertTitle className={analysisResult.isFeasible ? "text-green-900" : ""}>
                                            Diagnóstico General: {analysisResult.overallDiagnosis}
                                        </AlertTitle>
                                        <AlertDescription className={analysisResult.isFeasible ? "text-green-700" : ""}>
                                             {analysisResult.isFeasible 
                                                ? "El plan actual es viable y cumple con los objetivos."
                                                : "El plan actual no es suficiente para cumplir todos los objetivos."}
                                        </AlertDescription>
                                    </Alert>
                                    
                                    {analysisResult.criticalPoints.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 font-semibold flex items-center gap-2">
                                                <UserPlus className="h-4 w-4" />
                                                Puntos Clave
                                            </h4>
                                            <div className="space-y-2">
                                                {analysisResult.criticalPoints.map((point, i) => (
                                                    <Alert key={`c-${i}`} variant={point.toLowerCase().includes('déficit') ? "destructive" : "default"} className={point.toLowerCase().includes('déficit') ? "bg-destructive/5" : "bg-green-50"}>
                                                        <AlertDescription dangerouslySetInnerHTML={{ __html: point }} />
                                                    </Alert>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                     {analysisResult.improvementSuggestions.length > 0 && (
                                        <div>
                                            <h4 className="mb-2 font-semibold flex items-center gap-2 text-primary">
                                                <Lightbulb className="h-4 w-4" />
                                                Sugerencias de Mejora
                                            </h4>
                                            <div className="space-y-2">
                                                {analysisResult.improvementSuggestions.map((suggestion, i) => (
                                                     <Alert key={`s-${i}`} className="bg-primary/5 border-primary/20">
                                                         <Lightbulb className="h-4 w-4 !text-primary" />
                                                        <AlertDescription className="!pl-7" dangerouslySetInnerHTML={{ __html: suggestion }} />
                                                    </Alert>
                                                ))}
                                            </div>
                                        </div>
                                     )}
                                </div>
                            )}

                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
