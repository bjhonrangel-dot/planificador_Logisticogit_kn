
"use client";

import { Button } from "@/components/ui/button";
import { File, FileDown, Image as ImageIcon, Loader2, FileText } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { useToast } from "@/hooks/use-toast";
import type { Warehouse, PlannedTask, Productivity, EquipmentStatus } from "@/lib/types";
import html2canvas from "html2canvas";
import React from "react";
import { differenceInMinutes } from "date-fns";


export interface ReportButtonsProps {
    warehouse: Warehouse;
    stats: {
        productiveHoursPerPerson: number;
        totalManHours: number;
        availableStaff: number;
        totalShiftHours: number;
        totalBreakMinutes: number;
    };
    plannedTasks: (PlannedTask & {
        capacityAchieved: number;
        surplusOrDeficit: number;
        productivityData?: Productivity;
        productivityPerHour: number;
    })[];
    analysisData: {
        tasksWithData: any[];
        overallCompliance: number;
        totalTarget: number;
        totalCapacity: number;
    };
    productiveHoursPerPerson: number;
    equipmentStatus: EquipmentStatus[];
}

const generatePdf = async (props: ReportButtonsProps, isLight: boolean = false) => {
    const doc = new jsPDF();
    const { warehouse, stats, plannedTasks, analysisData, productiveHoursPerPerson, equipmentStatus } = props;
    let yPos = 15;

    // Header
    doc.setFontSize(20);
    doc.text(`Plan de Turno: ${warehouse.name}`, 14, yPos);
    yPos += 10;
    doc.setFontSize(12);
    doc.text(`Fecha del Reporte: ${new Date().toLocaleDateString()}`, 14, yPos);
    yPos += 15;

    // Shift Configuration
    doc.setFontSize(16);
    doc.text("1. Configuración del Turno", 14, yPos);
    yPos += 8;

    const [year, month, day] = warehouse.shiftDate.split('T')[0].split('-').map(Number);
    const shiftDate = new Date(Date.UTC(year, month - 1, day));


    autoTable(doc, {
        startY: yPos,
        head: [['Parámetro', 'Valor']],
        body: [
            ['Fecha del Turno', shiftDate.toLocaleDateString('es-ES', { timeZone: 'UTC' })],
            ['Hora Inicio', warehouse.shiftStartTime],
            ['Hora Fin', warehouse.shiftEndTime],
            ['Personal Total', warehouse.totalStaff.toString()],
            ['Personal Ausente', warehouse.absentStaff.toString()],
            ['Descanso (min)', warehouse.breakTime.toString()],
            ['Almuerzo (min)', warehouse.lunchTime.toString()],
        ],
        theme: 'striped',
        headStyles: { fillColor: [38, 70, 83] },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Shift Stats
    doc.setFontSize(16);
    doc.text("2. Estadísticas del Turno", 14, yPos);
    yPos += 8;
    autoTable(doc, {
        startY: yPos,
        head: [['Estadística', 'Valor']],
        body: [
            ['Personal Disponible', stats.availableStaff.toString()],
            ['Horas Turno', stats.totalShiftHours.toFixed(2) + ' h'],
            ['Total Descansos', stats.totalBreakMinutes.toString() + ' min'],
            ['H. Productivas / Persona', stats.productiveHoursPerPerson.toFixed(2) + ' h'],
            ['Total Horas Hombre', stats.totalManHours.toFixed(2) + ' h'],
        ],
        theme: 'grid',
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;
    
    // Planning Board (always included)
    doc.setFontSize(16);
    doc.text("3. Tablero de Planificación", 14, yPos);
    yPos += 8;
    
    const shiftStartTime = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftStartTime}`);
    const shiftEndTime = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftEndTime}`);
    if (shiftEndTime <= shiftStartTime) {
        shiftEndTime.setDate(shiftEndTime.getDate() + 1);
    }
    const totalShiftMinutes = differenceInMinutes(shiftEndTime, shiftStartTime);
    const totalBreakMinutes = warehouse.breakTime + warehouse.lunchTime;
    const productiveMinutesPerPerson = totalShiftMinutes - totalBreakMinutes;
    const efficiencyRatio = totalShiftMinutes > 0 ? productiveMinutesPerPerson / totalShiftMinutes : 0;

    autoTable(doc, {
        startY: yPos,
        head: [['Grupo', 'Proceso', 'Equip. Req.', 'Nº Pers.', 'Bal. Pers.', 'Cap. Lograda', 'Objetivo', 'Sobr./Falt.', 'Hora Fin Est.', 'Estado']],
        body: plannedTasks.map(t => {
            const productivityData = warehouse.baseProductivity.find(p => p.id === t.productivityId);
            const productivityPerHour = productivityData?.productivity || 0;
            const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && productivityPerHour > 0)
                ? Math.ceil(t.target / (productiveHoursPerPerson * productivityPerHour))
                : 0;
            const staffBalance = t.assignedStaff.length - theoreticalStaffNeeded;

            const equipmentReq = productivityData?.equipment 
                ? Object.entries(productivityData.equipment).map(([name, req]) => `${name} (x${req})`).join(', ')
                : '-';
            
            let completionTime = "N/A";
            if (efficiencyRatio > 0 && t.assignedStaff.length > 0 && productivityPerHour > 0) {
                const totalProductivityPerHour = t.assignedStaff.length * productivityPerHour;
                const productiveHoursToComplete = t.target / totalProductivityPerHour;
                const wallClockMinutesToComplete = (productiveHoursToComplete * 60) / efficiencyRatio;
                const completionDate = new Date(shiftStartTime.getTime() + wallClockMinutesToComplete * 60 * 1000);
                completionTime = completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
            }

            return [
                t.group || 'N/A',
                t.name,
                equipmentReq,
                t.assignedStaff.length,
                staffBalance > 0 ? `+${staffBalance}` : staffBalance,
                Math.round(t.capacityAchieved).toLocaleString(),
                t.target.toLocaleString(),
                Math.round(t.surplusOrDeficit).toLocaleString(),
                completionTime,
                t.surplusOrDeficit >= 0 ? 'CUMPLE' : 'NO CUMPLE',
            ]
        }),
        theme: 'striped',
        headStyles: { fillColor: [38, 70, 83] },
        didParseCell: function (data) {
            if (data.column.index === 9 && data.cell.section === 'body') {
                if (data.cell.raw && (data.cell.raw as string).includes('CUMPLE')) {
                    data.cell.styles.textColor = [0, 128, 0];
                } else {
                    data.cell.styles.textColor = [255, 0, 0];
                }
            }
            if (data.column.index === 4 && data.cell.section === 'body') {
                const value = Number(data.cell.raw);
                if (value < 0) {
                     data.cell.styles.textColor = [255, 0, 0];
                } else if (value > 0) {
                    data.cell.styles.textColor = [0, 128, 0];
                }
            }
             if (data.column.index === 7 && data.cell.section === 'body') {
                const value = Number(String(data.cell.raw).replace(/[^0-9-]/g, ''));
                if (value < 0) {
                     data.cell.styles.textColor = [255, 0, 0];
                } else if (value > 0) {
                    data.cell.styles.textColor = [0, 128, 0];
                }
            }
        },
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;


    // Equipment Availability
    doc.setFontSize(16);
    doc.text("4. Disponibilidad de Equipamiento", 14, yPos);
    yPos += 8;
    autoTable(doc, {
        startY: yPos,
        head: [['Equipo', 'Total', 'En Uso', 'Disponible']],
        body: equipmentStatus.map(e => [
            e.name,
            e.total.toString(),
            e.inUse.toString(),
            e.available.toString(),
        ]),
        theme: 'grid',
        didParseCell: function (data) {
            if (data.column.index === 3 && data.cell.section === 'body') {
                const value = Number(data.cell.raw);
                if (value < 0) {
                     data.cell.styles.textColor = [255, 0, 0];
                } else if (value > 0) {
                    data.cell.styles.textColor = [0, 128, 0];
                }
            }
        }
    });
    yPos = (doc as any).lastAutoTable.finalY + 15;

    // Analysis and Dashboards Summary
    doc.setFontSize(16);
    doc.text("5. Análisis y Resumen de Dashboards", 14, yPos);
    yPos += 8;
    
    const isFeasibleAnalysis = analysisData.overallCompliance >= 100;
    let overallDiagnosis = isFeasibleAnalysis ? "El plan es viable y cumple con los objetivos generales." : "El plan no es suficiente para cumplir todos los objetivos.";
    if (plannedTasks.length === 0) {
        overallDiagnosis = "No hay tareas en el plan para analizar.";
    }

    autoTable(doc, {
        startY: yPos,
        head: [['Métrica de Desempeño', 'Valor']],
        body: [
            ['Cumplimiento General del Plan', `${Math.round(analysisData.overallCompliance)}%`],
            ['Capacidad Total Proyectada', `${Math.round(analysisData.totalCapacity).toLocaleString()} unidades`],
            ['Objetivo Total', `${analysisData.totalTarget.toLocaleString()} unidades`],
            ['Diagnóstico General', overallDiagnosis],
        ],
        theme: 'grid',
        didParseCell: function(data) {
            if (data.row.index === 0 && data.column.index === 1) {
                data.cell.styles.textColor = analysisData.overallCompliance >= 100 ? [0, 128, 0] : [255, 0, 0];
                data.cell.styles.fontStyle = 'bold';
            }
             if (data.row.index === 3 && data.column.index === 1) {
                data.cell.styles.textColor = isFeasibleAnalysis ? [0, 128, 0] : [255, 0, 0];
            }
        }
    });
    yPos = (doc as any).lastAutoTable.finalY;

    // Add dashboard image
    const dashboardElement = document.getElementById('main-dashboard-content');
    if (dashboardElement) {
        doc.addPage();
        yPos = 15;
        doc.setFontSize(16);
        doc.text("6. Captura del Dashboard", 14, yPos);
        yPos += 10;
        
        const canvas = await html2canvas(dashboardElement, {
            scale: isLight ? 1 : 2, // Lower scale for lighter PDF
            useCORS: true,
            backgroundColor: '#ffffff', 
        });

        // Use JPEG for smaller file size, especially for the light version
        const imgData = canvas.toDataURL(isLight ? 'image/jpeg' : 'image/png', isLight ? 0.7 : 1.0);
        
        const imgProps = doc.getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth() - 28;
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        doc.addImage(imgData, isLight ? 'JPEG' : 'PNG', 14, yPos, pdfWidth, pdfHeight);
    }
    

    const fileName = `${warehouse.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}${isLight ? '_ligero' : ''}.pdf`;
    doc.save(fileName);
};

const generateExcel = (props: ReportButtonsProps) => {
    const { warehouse, stats, plannedTasks, analysisData, productiveHoursPerPerson, equipmentStatus } = props;
    const wb = XLSX.utils.book_new();

    const [year, month, day] = warehouse.shiftDate.split('T')[0].split('-').map(Number);
    const shiftDate = new Date(Date.UTC(year, month - 1, day));

    // Summary Sheet
    const summaryData = [
        ['Resumen del Turno', ''],
        ['Bodega', warehouse.name],
        ['Fecha', shiftDate.toLocaleDateString('es-ES', { timeZone: 'UTC' })],
        ['', ''],
        ['Configuración', ''],
        ['Hora Inicio', warehouse.shiftStartTime],
        ['Hora Fin', warehouse.shiftEndTime],
        ['Personal Total', warehouse.totalStaff],
        ['Personal Ausente', warehouse.absentStaff],
        ['Descanso (min)', warehouse.breakTime],
        ['Almuerzo (min)', warehouse.lunchTime],
        ['', ''],
        ['Estadísticas Clave', ''],
        ['Personal Disponible', stats.availableStaff],
        ['Horas Turno', stats.totalShiftHours.toFixed(2)],
        ['Total Descansos (min)', stats.totalBreakMinutes],
        ['H. Productivas / Persona', stats.productiveHoursPerPerson.toFixed(2)],
        ['Total Horas Hombre', stats.totalManHours.toFixed(2)],
    ];
    const summaryWs = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen Turno');

    // Planning Sheet
    const planningHeader = ['Grupo', 'Proceso', 'Equip. Req.','Unidad Medida', 'Nº Personal Asignado', 'Balance Personal', 'Capacidad Lograda', 'Cantidad Objetivo', 'Sobrante/Faltante', 'Hora Fin Est.', 'Estado'];
    
    const shiftStartTime = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftStartTime}`);
    const shiftEndTime = new Date(`${warehouse.shiftDate.slice(0, 10)}T${warehouse.shiftEndTime}`);
    if (shiftEndTime <= shiftStartTime) {
        shiftEndTime.setDate(shiftEndTime.getDate() + 1);
    }
    const totalShiftMinutes = differenceInMinutes(shiftEndTime, shiftStartTime);
    const totalBreakMinutes = warehouse.breakTime + warehouse.lunchTime;
    const productiveMinutesPerPerson = totalShiftMinutes - totalBreakMinutes;
    const efficiencyRatio = totalShiftMinutes > 0 ? productiveMinutesPerPerson / totalShiftMinutes : 0;
    
    const planningData = plannedTasks.map(t => {
         const productivityData = warehouse.baseProductivity.find(p => p.id === t.productivityId);
         const productivityPerHour = productivityData?.productivity || 0;
         const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && productivityPerHour > 0)
                ? Math.ceil(t.target / (productiveHoursPerPerson * productivityPerHour))
                : 0;
         const staffBalance = t.assignedStaff.length - theoreticalStaffNeeded;
         const equipmentReq = productivityData?.equipment 
                ? Object.entries(productivityData.equipment).map(([name, req]) => `${name} (x${req})`).join(', ')
                : '-';
        
        let completionTime = "N/A";
        if (efficiencyRatio > 0 && t.assignedStaff.length > 0 && productivityPerHour > 0) {
            const totalProductivityPerHour = t.assignedStaff.length * productivityPerHour;
            const productiveHoursToComplete = t.target / totalProductivityPerHour;
            const wallClockMinutesToComplete = (productiveHoursToComplete * 60) / efficiencyRatio;
            const completionDate = new Date(shiftStartTime.getTime() + wallClockMinutesToComplete * 60 * 1000);
            completionTime = completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
        }

        return [
            t.group || 'N/A',
            t.name,
            equipmentReq,
            t.unitOfMeasure || 'unidades',
            t.assignedStaff.length,
            staffBalance,
            Math.round(t.capacityAchieved),
            t.target,
            Math.round(t.surplusOrDeficit),
            completionTime,
            t.surplusOrDeficit >= 0 ? 'CUMPLE' : 'NO CUMPLE',
        ]
    });
    const planningWs = XLSX.utils.aoa_to_sheet([planningHeader, ...planningData]);
    XLSX.utils.book_append_sheet(wb, planningWs, 'Tablero Planificación');

    // Equipment Sheet
    const equipmentHeader = ['Equipo', 'Total', 'En Uso', 'Disponible'];
    const equipmentData = equipmentStatus.map(e => [e.name, e.total, e.inUse, e.available]);
    const equipmentWs = XLSX.utils.aoa_to_sheet([equipmentHeader, ...equipmentData]);
    XLSX.utils.book_append_sheet(wb, equipmentWs, 'Disponibilidad Equipos');

    // Analysis Sheet
    let isFeasible = true;
    const criticalPoints: string[] = [];
    const improvementSuggestions: string[] = [];

    const tasksWithTime = plannedTasks.map(task => {
        let completionTime = "N/A";
        let finishesOnTime = false;
        const productivityData = warehouse.baseProductivity.find(p => p.id === task.productivityId);
        const productivityPerHour = productivityData?.productivity || 0;

        if (efficiencyRatio > 0 && task.assignedStaff.length > 0 && productivityPerHour > 0) {
            const totalProductivityPerHour = task.assignedStaff.length * productivityPerHour;
            const productiveHoursToComplete = task.target / totalProductivityPerHour;
            const wallClockMinutesToComplete = (productiveHoursToComplete * 60) / efficiencyRatio;
            const completionDate = new Date(shiftStartTime.getTime() + wallClockMinutesToComplete * 60 * 1000);
            
            if (completionDate <= shiftEndTime) {
                completionTime = completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
                finishesOnTime = true;
            } else {
                 completionTime = completionDate.toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit', hour12: true });
                 finishesOnTime = false;
            }
        }
        return {...task, completionTime, finishesOnTime, productivityPerHour};
    });

    const surplusTasks = tasksWithTime.filter(t => t.capacityAchieved >= t.target);
    const deficitTasks = tasksWithTime.filter(t => t.capacityAchieved < t.target);

    deficitTasks.forEach(task => {
        isFeasible = false;
        const deficit = Math.abs(task.capacityAchieved - task.target);
        criticalPoints.push(`Tarea "${task.name}": Déficit de ${Math.round(deficit).toLocaleString()} ${task.unitOfMeasure || 'unidades'}.`);
        if (productiveHoursPerPerson > 0 && task.productivityPerHour > 0) {
            const unitsPerPerson = productiveHoursPerPerson * task.productivityPerHour;
            const peopleNeeded = Math.ceil(deficit / unitsPerPerson);
            improvementSuggestions.push(`Para "${task.name}": Considere asignar ${peopleNeeded} persona(s) más.`);
        }
    });

     surplusTasks.forEach(task => {
        const theoreticalStaffNeeded = (productiveHoursPerPerson > 0 && task.productivityPerHour > 0) ? Math.ceil(task.target / (task.productivityPerHour * productiveHoursPerPerson)) : 0;
        const surplusStaff = task.assignedStaff.length - theoreticalStaffNeeded;
        if (surplusStaff > 0) {
             criticalPoints.push(`Tarea "${task.name}": Excedente de ${Math.round(task.surplusOrDeficit).toLocaleString()} ${task.unitOfMeasure || 'unidades'}. Hay ${surplusStaff} persona(s) que podrían ser reasignadas.`);
        }
        if (task.finishesOnTime && deficitTasks.length > 0) {
            improvementSuggestions.push(`Reasignación Futura: El equipo de "${task.name}" finaliza a las ${task.completionTime}. A partir de esa hora, pueden ser reasignados a tareas con déficit.`);
        }
    });

     if (isFeasible && analysisData.tasksWithData.length > 0) {
        improvementSuggestions.push("¡Excelente planificación! Todos los objetivos se cumplen.");
    }

    const analysisSheetData = [
        ['Análisis de Viabilidad', ''],
        ['Diagnóstico General', isFeasible ? 'Cumple' : 'Incumple'],
        ['', ''],
        ['Puntos Clave', ''],
        ...criticalPoints.map(p => [p]),
        ['', ''],
        ['Sugerencias de Mejora', ''],
        ...improvementSuggestions.map(s => [s]),
    ];
    const analysisWs = XLSX.utils.aoa_to_sheet(analysisSheetData);
    XLSX.utils.book_append_sheet(wb, analysisWs, 'Análisis de Mejora');
    
    // Raw Data Sheet
    const rawDataWs = XLSX.utils.json_to_sheet(plannedTasks);
    XLSX.utils.book_append_sheet(wb, rawDataWs, 'Datos Origen');

    XLSX.writeFile(wb, `${warehouse.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export function ReportButtons(props: ReportButtonsProps) {
    const { toast } = useToast();
    const [isExporting, setIsExporting] = React.useState<string | null>(null);

    const handleExport = async (generator: (props: ReportButtonsProps, isLight?: boolean) => Promise<void> | void, format: string, isLight: boolean = false) => {
        if (props.plannedTasks.length === 0) {
             toast({
                variant: "destructive",
                title: "No hay datos para exportar",
                description: "Por favor, añada tareas al tablero antes de exportar.",
            });
            return;
        }

        const exportType = `${format}${isLight ? '-light' : ''}`;
        setIsExporting(exportType);
        toast({
            title: `Generando ${format}${isLight ? ' Ligero' : ''}...`,
            description: "El documento se está creando, por favor espere.",
        });

        try {
            await Promise.resolve(generator(props, isLight));
            toast({
                title: `¡${format}${isLight ? ' Ligero' : ''} generado!`,
                description: "La descarga de su archivo ha comenzado.",
            });
        } catch (error) {
            console.error(`Failed to generate ${format}:`, error);
            toast({
                variant: "destructive",
                title: `Error al generar ${format}`,
                description: "Hubo un problema al crear el documento. Revise la consola para más detalles.",
            });
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport(generatePdf, 'PDF')} disabled={!!isExporting} className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground border-primary-foreground/30">
                {isExporting === 'PDF' ? <Loader2 className="animate-spin" /> : <File />}
                Exportar PDF
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport(generatePdf, 'PDF', true)} disabled={!!isExporting} className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground border-primary-foreground/30">
                {isExporting === 'PDF-light' ? <Loader2 className="animate-spin" /> : <FileText />}
                PDF Ligero
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport(generateExcel, 'Excel')} disabled={!!isExporting} className="bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20 hover:text-primary-foreground border-primary-foreground/30">
                 {isExporting === 'Excel' ? <Loader2 className="animate-spin" /> : <FileDown />}
                Exportar Excel
            </Button>
        </div>
    );
}
