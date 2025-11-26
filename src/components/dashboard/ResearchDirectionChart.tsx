import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const mockData = [
  { name: "心血管疾病", searchCount: 245, datasets: 12 },
  { name: "肿瘤学", searchCount: 198, datasets: 18 },
  { name: "神经科学", searchCount: 167, datasets: 8 },
  { name: "内分泌学", searchCount: 134, datasets: 6 },
  { name: "免疫学", searchCount: 123, datasets: 9 },
  { name: "感染性疾病", searchCount: 98, datasets: 5 },
];

export function ResearchDirectionChart() {
  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>研究方向热度</CardTitle>
        <CardDescription>按搜索频次排序的热门研究领域</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={mockData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="name" 
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
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: "hsl(var(--card))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "6px"
              }}
            />
            <Bar 
              dataKey="searchCount" 
              fill="hsl(var(--primary))" 
              radius={[4, 4, 0, 0]}
              name="搜索次数"
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}