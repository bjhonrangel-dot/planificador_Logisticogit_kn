"use client"

import * as React from "react"
import { Label, Pie, PieChart, Cell, ResponsiveContainer } from "recharts"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  ChartContainer,
} from "@/components/ui/chart"

export function ComplianceChart({ compliance }: { compliance: number }) {
  const chartData = [
    { name: "Cumplido", value: Math.min(compliance, 100), fill: "hsl(var(--primary))" },
    { name: "Faltante", value: Math.max(0, 100 - compliance), fill: "hsl(var(--muted))" },
  ]

  const displayCompliance = Math.round(compliance);

  return (
    <Card className="flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <CardHeader className="items-center pb-0">
        <CardTitle>Cumplimiento General</CardTitle>
        <CardDescription>Porcentaje total de objetivos alcanzados.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={{}}
          className="mx-auto aspect-square h-full max-h-[250px]"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius="80%"
                strokeWidth={5}
                startAngle={90}
                endAngle={450}
                cornerRadius={5}
              >
                 {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text
                          x={viewBox.cx}
                          y={viewBox.cy}
                          textAnchor="middle"
                          dominantBaseline="middle"
                        >
                          <tspan
                            x={viewBox.cx}
                            y={viewBox.cy}
                            className="fill-foreground text-3xl font-bold"
                          >
                            {`${displayCompliance}%`}
                          </tspan>
                        </text>
                      )
                    }
                  }}
                />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
