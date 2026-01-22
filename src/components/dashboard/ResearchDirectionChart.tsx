import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import {getPopularSubjects} from "@/integrations/api/statisticsApi.ts";
import {ResearchSubject} from "@/integrations/api/datasetApi.ts";


export function ResearchDirectionChart() {
  const [data, setData] = useState<ResearchSubject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPopularSubjects = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // 获取热门研究学科列表
        const response = await getPopularSubjects();
        if (response.data.success) {
          // 获取每个研究学科的具体热度值
          const subjectsWithPopularity = await Promise.all(
            response.data.data.map(async (subject) => {
              try {
                const searchCount = subject.weeklyPopularity || 0
                return {
                  ...subject,
                  searchCount
                };
              } catch (error) {
                console.error(`获取研究学科 ${subject.name} 的热度失败:`, error);
                return {
                  ...subject,
                  weeklyPopularity: 0
                };
              }
            })
          );
          
          setData(subjectsWithPopularity);
        } else {
          throw new Error(response.data.message || "获取热门研究学科失败");
        }
      } catch (error) {
        console.error("获取研究学科热度数据失败:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularSubjects();
  }, []);

  if (error) {
    console.warn(error);
  }

  return (
    <div className="col-span-2">
        {loading ? (
          <div className="flex items-center justify-center h-[350px]">
            <p>加载中...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart maxBarSize={75} data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                fontSize={14}
                tickLine={false}
                axisLine={false}
                className="text-muted-foreground"
              />
              <YAxis 
                fontSize={14}
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
                formatter={(value) => [value, "访问热度"]}
                labelFormatter={(label) => `研究学科: ${label}`}
              />
              <Bar 
                dataKey="weeklyPopularity" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="访问热度"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
    </div>
  );
}