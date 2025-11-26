import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useMemo } from "react";

interface DatasetTrendChartProps {
  datasets: any[];
}

export function DatasetTrendChart({ datasets }: DatasetTrendChartProps) {
  const trendData = useMemo(() => {
    // Group datasets by year
    const yearMap = new Map<number, { total: number; published: number; approved: number }>();
    
    datasets.forEach((dataset) => {
      const year = new Date(dataset.created_at).getFullYear();
      if (!yearMap.has(year)) {
        yearMap.set(year, { total: 0, published: 0, approved: 0 });
      }
      const data = yearMap.get(year)!;
      data.total++;
      if (dataset.published) data.published++;
      if (dataset.approved) data.approved++;
    });

    // Convert to array and sort by year
    return Array.from(yearMap.entries())
      .map(([year, data]) => ({
        year: year.toString(),
        total: data.total,
        published: data.published,
        approved: data.approved,
      }))
      .sort((a, b) => parseInt(a.year) - parseInt(b.year));
  }, [datasets]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据集发布趋势</CardTitle>
        <CardDescription>按年份统计数据集的发布情况</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="year" 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
            />
            <YAxis 
              fontSize={12}
              tickLine={false}
              axisLine={false}
              className="text-muted-foreground"
              allowDecimals={false}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--primary))", r: 4 }}
              name="总数据集"
              activeDot={{ r: 6 }}
            />
            <Line 
              type="monotone" 
              dataKey="published" 
              stroke="hsl(var(--chart-2))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
              name="已发布"
            />
            <Line 
              type="monotone" 
              dataKey="approved" 
              stroke="hsl(var(--chart-3))" 
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-3))", r: 4 }}
              name="已审核"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
