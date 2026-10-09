

export interface AnalyzePlanFeasibilityOutput {
    isFeasible: boolean;
    overallDiagnosis: string;
    criticalPoints: string[];
    improvementSuggestions: string[];
}

export interface Productivity {
    id: string;
    group?: string; // e.g., Inbound, Outbound, VAS
    name: string;
    unitOfMeasure?: string; // e.g., "unidades", "cajas", "pallets"
    productivity: number; // units per hour
    equipment?: { [key: string]: number }; // e.g., { "forklift": 1 }
}
  
export interface PersonnelIcon {
    id: string;
    icon: string;
}

export interface EquipmentStatus {
    name: string;
    total: number;
    inUse: number;
    available: number;
}
  
export interface Warehouse {
    id: string;
    name: string;
    password?: string; // base64 encoded
    shiftDate: string; // ISO string
    shiftStartTime: string; // "HH:mm"
    shiftEndTime: string; // "HH:mm"
    totalStaff: number;
    absentStaff: number;
    breakTime: number; // minutes
    lunchTime: number; // minutes
    baseProductivity: Productivity[];
    equipment: { [key: string]: number }; // e.g., { "forklift": 5 }
    personnelIcons: PersonnelIcon[];
}
  
export interface PlannedTask {
    id: string; 
    warehouseId: string;
    productivityId: string;
    group?: string;
    name: string;
    unitOfMeasure?: string;
    target: number;
    assignedStaff: PersonnelIcon[];
    status?: 'Not Started' | 'In Progress' | 'Completed';
}
