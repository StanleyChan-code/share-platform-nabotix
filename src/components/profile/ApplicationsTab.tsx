import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {Download, FileText} from "lucide-react";

const ApplicationsTab = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
          数据申请记录
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="text-center text-muted-foreground">
            <p>申请记录功能正在开发中...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationsTab;