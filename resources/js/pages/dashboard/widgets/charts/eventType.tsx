"use client"

import React from "react"
import { Pie, PieChart, Cell } from "recharts"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import type { EventTypeDistribution } from "@/types"

interface EventTypeChartProps {
    data: EventTypeDistribution[];
}

const COLORS = {
    free: "hsl(221.2 83.2% 53.3%)",
    paid: "hsl(0 84.2% 60.2%)",
    private: "hsl(24.6 95% 53.1%)",
    default: "hsl(210 40% 96.1%)",
};

export default function EventTypeChartWidget({ data }: EventTypeChartProps) {
    const chartConfig = data.reduce((acc, item) => {
        acc[item.type] = {
            label: item.type.charAt(0).toUpperCase() + item.type.slice(1),
            color: COLORS[item.type as keyof typeof COLORS] || COLORS.default,
        };
        return acc;
    }, {} as ChartConfig);
    const chartData = data.map(item => ({
        ...item,
        count: Number(item.count),
        fill: chartConfig[item.type]?.color,
    }));

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle>Event Type Distribution</CardTitle>
                <CardDescription>A breakdown of all events by their type.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                <ChartContainer
                    config={chartConfig}
                    className="mx-auto aspect-square max-h-[250px]"
                >
                    <PieChart>
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent hideLabel />}
                        />
                        <Pie
                            data={chartData}
                            dataKey="count"
                            nameKey="type"
                            innerRadius={60}
                            strokeWidth={5}
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <ChartLegend
                            content={<ChartLegendContent nameKey="type" />}
                            className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
                        />
                    </PieChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
