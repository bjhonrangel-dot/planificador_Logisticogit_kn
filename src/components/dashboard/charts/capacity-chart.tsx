"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltipContent } from "@/components/ui/chart"

const chartConfig = {
  capacidad: {
    label: "Capacidad",
    color: "hsl(var(--primary))",
  },
  objetivo: {
    label: "Objetivo",
    color: "hsl(var(--muted-foreground))",
  },
} satisfies ChartConfig

export function CapacityChart({ data }: { data: { name: string; target: number; capacityAchieved: number }[] }) {
    const chartData = data.map(item => ({
        name: item.name,
        objetivo: item.target,
        capacidad: Math.round(item.capacityAchieved),
    }));

  return (
    <Card className="transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader>
        <CardTitle>Capacidad vs. Objetivo por Tarea</CardTitle>
        <CardDescription>Comparación directa entre la capacidad proyectada y el objetivo de producción.</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="min-h-64 w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tickFormatter={(value) => new Intl.NumberFormat('es-CL').format(value as number)} />
                    <Tooltip content={<ChartTooltipContent />} />
                    <Legend />
                    <Bar dataKey="objetivo" fill={chartConfig.objetivo.color} name="Objetivo" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="capacidad" fill={chartConfig.capacidad.color} name="Capacidad" radius={[4, 4, 0, 0]}/>
                </BarChart>
            </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
