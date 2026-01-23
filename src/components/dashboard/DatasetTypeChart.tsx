import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { DatasetTypes } from "@/lib/enums";

interface DatasetTypeChartProps {
  data?: Record<string, number>;
}

export function DatasetTypeChart({ data }: DatasetTypeChartProps) {
  // 如果没有提供数据，使用模拟数据
  const chartData = data 
    ? Object.entries(data).map(([type, count]) => ({
        name: DatasetTypes[type as keyof typeof DatasetTypes] || type,
        value: count,
        color: getColorForType(type)
      }))
    : [
        { name: "队列研究", value: 0, color: "hsl(var(--chart-1))" },
        { name: "病例对照", value: 0, color: "hsl(var(--chart-2))" },
        { name: "横断面研究", value: 0, color: "hsl(var(--chart-3))" },
        { name: "随机对照试验", value: 0, color: "hsl(var(--chart-4))" },
        { name: "登记研究", value: 0, color: "hsl(var(--chart-5))" },
        { name: "生物样本库", value: 0, color: "hsl(var(--primary))" },
        { name: "组学数据", value: 0, color: "hsl(var(--secondary))" },
        { name: "可穿戴设备", value: 0, color: "hsl(var(--accent))" },
      ];

  // 计算总数用于百分比计算
  const total = chartData.reduce((sum, item) => sum + item.value, 0);
  
  // 根据数据集类型返回对应颜色
  function getColorForType(type: string): string {
    const colorMap: Record<string, string> = {
      COHORT: "hsl(var(--chart-1))",
      CASE_CONTROL: "hsl(var(--chart-2))",
      CROSS_SECTIONAL: "hsl(var(--chart-3))",
      RCT: "hsl(var(--chart-4))",
      REGISTRY: "hsl(var(--chart-5))",
      BIOBANK: "hsl(var(--primary))",
      OMICS: "hsl(var(--secondary))",
      WEARABLE: "hsl(var(--accent))"
    };
    
    return colorMap[type] || "hsl(var(--muted))";
  }

  // 自定义 Tooltip 显示格式
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = total > 0 ? ((data.value / total) * 100).toFixed(1) : "0.0";
      return (
        <div className="bg-card border border-border rounded-md p-2 shadow-sm">
          <p className="text-sm font-medium">{`${data.name}`}</p>
          <p className="text-sm">{`数量: ${data.value}`}</p>
          <p className="text-sm">{`占比: ${percentage}%`}</p>
        </div>
      );
    }
    return null;
  };

  // 自定义图例文本渲染函数
  const renderLegendText = (value: string) => {
    return (
      <span style={{ color: 'hsl(var(--foreground))', fontSize: '12px' }}>
        {value}
      </span>
    );
  };

  return (
    <div>
        <ResponsiveContainer width="100%" height={350}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ fontSize: "16px", paddingTop: "10px" }}
              formatter={(value) => renderLegendText(value)}
            />
          </PieChart>
        </ResponsiveContainer>
    </div>
  );
}
