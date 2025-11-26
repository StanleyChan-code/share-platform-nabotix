import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const mockData = [
  { name: "队列研究", value: 28, color: "hsl(var(--chart-1))" },
  { name: "病例对照", value: 22, color: "hsl(var(--chart-2))" },
  { name: "横断面研究", value: 18, color: "hsl(var(--chart-3))" },
  { name: "随机对照试验", value: 15, color: "hsl(var(--chart-4))" },
  { name: "登记研究", value: 10, color: "hsl(var(--chart-5))" },
  { name: "生物样本库", value: 4, color: "hsl(var(--primary))" },
  { name: "组学数据", value: 2, color: "hsl(var(--secondary))" },
  { name: "可穿戴设备", value: 1, color: "hsl(var(--accent))" },
];

export function DatasetTypeChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>数据集类型分布</CardTitle>
        <CardDescription>不同类型数据集的占比情况</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={mockData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {mockData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
              formatter={(value) => [`${value}%`, "占比"]}
            />
            <Legend 
              wrapperStyle={{ fontSize: "12px" }}
              formatter={(value) => value}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}