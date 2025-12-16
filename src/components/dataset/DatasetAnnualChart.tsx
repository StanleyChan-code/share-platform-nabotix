import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ComposedChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line } from "recharts";
import { useMemo } from "react";

interface AnnualData {
  year: number;
  count: number;
}

interface DatasetAnnualChartProps {
  data: AnnualData[];
}

export function DatasetAnnualChart({ data }: DatasetAnnualChartProps) {
  const chartData = useMemo(() => {
    // Sort data by year
    const sortedData = [...data].sort((a, b) => a.year - b.year);
    
    // Calculate cumulative count
    let cumulativeCount = 0;
    return sortedData.map(item => {
      cumulativeCount += item.count;
      return {
        year: item.year.toString(),
        count: item.count,
        cumulative: cumulativeCount
      };
    });
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>数据集年度发布统计</CardTitle>
        <CardDescription>每年发布数量及累计总数</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              name="年度数量"
              maxBarSize={75}
            />
            <Line
                type="monotone"
                dataKey="cumulative"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--chart-2))", r: 4 }}
                name="累计总数"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}