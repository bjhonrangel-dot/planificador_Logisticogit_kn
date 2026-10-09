
"use client";

import { Users, Clock, Coffee, Anchor } from 'lucide-react';

const StatCard = ({ icon, label, value, unit, isHighlighted }: { icon: React.ReactNode, label: string, value: string | number, unit: string, isHighlighted?: boolean }) => (
    <div className={`p-3 rounded-lg flex flex-col items-center justify-center gap-1 text-center transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-1 ${isHighlighted ? 'bg-primary/80 text-primary-foreground' : 'bg-primary/10'}`}>
        <div className={`flex items-center gap-2 text-sm ${isHighlighted ? 'text-primary-foreground/80' : 'text-primary/80'}`}>
            {icon} {label}
        </div>
        <div className={`text-2xl font-bold ${isHighlighted ? 'text-primary-foreground' : 'text-primary'}`}>
            {value}<span className="text-base font-medium">{unit}</span>
        </div>
    </div>
);

interface StatsBarProps {
  stats: {
    productiveHoursPerPerson: number;
    totalManHours: number;
    availableStaff: number;
    totalShiftHours: number;
    totalBreakMinutes: number;
  };
}

export function StatsBar({ stats }: StatsBarProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard icon={<Users size={16} />} label="Personal Disponible" value={stats.availableStaff} unit="" />
            <StatCard icon={<Clock size={16} />} label="Horas Turno" value={stats.totalShiftHours.toFixed(2)} unit="h" />
            <StatCard icon={<Coffee size={16} />} label="Descansos" value={stats.totalBreakMinutes} unit="min" />
            <StatCard icon={<Anchor size={16} />} label="H. Productivas / Persona" value={stats.productiveHoursPerPerson.toFixed(2)} unit="h" />
            <StatCard icon={<Users size={16} />} label="Total Horas Hombre" value={stats.totalManHours.toFixed(2)} unit="h" isHighlighted />
        </div>
    );
}

