import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useEffect, useState } from "react";
import {getPopularSubjects, getSubjectPopularity} from "@/integrations/api/statisticsApi.ts";
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
        
        // 获取热门研究方向列表
        const response = await getPopularSubjects();
        if (response.data.success) {
          // 获取每个研究方向的具体热度值
          const subjectsWithPopularity = await Promise.all(
            response.data.data.content.map(async (subject) => {
              try {
                const searchCount = subject.searchCount || 0
                return {
                  ...subject,
                  searchCount
                };
              } catch (error) {
                console.error(`获取研究方向 ${subject.name} 的热度失败:`, error);
                return {
                  ...subject,
                  searchCount: 0
                };
              }
            })
          );
          
          setData(subjectsWithPopularity);
        } else {
          throw new Error(response.data.message || "获取热门研究方向失败");
        }
      } catch (error) {
        console.error("获取研究方向热度数据失败:", error);
        setError("获取数据失败，显示模拟数据");
        
        // 出错时使用模拟数据
        setData([
          { id: "1", name: "心血管疾病", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 245, nameEn: "" },
          { id: "2", name: "肿瘤学", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 198, nameEn: "" },
          { id: "3", name: "神经科学", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 167, nameEn: "" },
          { id: "4", name: "内分泌学", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 134, nameEn: "" },
          { id: "5", name: "免疫学", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 123, nameEn: "" },
          { id: "6", name: "感染性疾病", description: "", active: true, createdAt: "", updatedAt: "", searchCount: 98, nameEn: "" },
        ]);
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
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle>研究方向热度</CardTitle>
        <CardDescription>按搜索频次排序的热门研究领域</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center h-[300px]">
            <p>加载中...</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
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
                formatter={(value) => [value, "搜索次数"]}
                labelFormatter={(label) => `研究方向: ${label}`}
              />
              <Bar 
                dataKey="searchCount" 
                fill="hsl(var(--primary))" 
                radius={[4, 4, 0, 0]}
                name="搜索次数"
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}