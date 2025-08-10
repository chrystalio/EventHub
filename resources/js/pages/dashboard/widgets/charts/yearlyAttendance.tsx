"use client"

import React from "react"
import { Bar, BarChart, CartesianGrid, Legend, XAxis, YAxis } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { MonthlyAttendanceData } from "@/types"

interface YearlyAttendanceChartProps {
    data: MonthlyAttendanceData[];
}

const chartConfig = {
    attended: {
        label: "Attended",
        color: "hsl(221.2 83.2% 53.3%)",
    },
    missed: {
        label: "Missed",
        color: "hsl(0 84.2% 60.2%)",
    },
} satisfies ChartConfig

export default function YearlyAttendanceChartWidget({ data }: YearlyAttendanceChartProps) {
    const hasData = React.useMemo(() => data.some(item => item.attended > 0 || item.missed > 0), [data]);
    const formatLegendValue = (value: keyof typeof chartConfig) => {
        return chartConfig[value]?.label || value;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>My Yearly Attendance</CardTitle>
                <CardDescription>A summary of your event attendance for the current year.</CardDescription>
            </CardHeader>
            <CardContent>
                {hasData ? (
                    <ChartContainer config={chartConfig} className="min-h-[300px] w-full">
                        <BarChart accessibilityLayer data={data}>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={10}
                                allowDecimals={false}
                            />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="dashed" />}
                            />
                            <Legend
                                formatter={formatLegendValue}
                                verticalAlign="top"
                                wrapperStyle={{ paddingBottom: '1rem' }}
                            />
                            <Bar dataKey="attended" fill="var(--color-attended)" radius={4} />
                            <Bar dataKey="missed" fill="var(--color-missed)" radius={4} />
                        </BarChart>
                    </ChartContainer>
                ) : (
                    <div className="flex h-[300px] w-full items-center justify-center rounded-lg border-2 border-dashed">
                        <p className="text-sm text-muted-foreground">No attendance data to display for this year.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
