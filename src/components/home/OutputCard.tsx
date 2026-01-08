import { Calendar, Users, FileText, Database, Award } from "lucide-react";
import { OutputTypes } from "@/lib/enums";
import { formatDate } from "@/lib/utils";
import { getJournalPartitionName } from "@/lib/outputUtils.ts";

interface OutputCardProps {
  output: any;
}

export const OutputCard = ({ output }: OutputCardProps) => {
  // 获取期刊分区信息
  const getJournalPartition = () => {
    if (!output.otherInfo || !output.otherInfo.journalPartition) return null;
    return getJournalPartitionName(output.otherInfo.journalPartition) || null;
  };

  // 判断是否为论文类型
  const isPaperType = output.type === 'PAPER';

  // 判断是否显示高质量成果标记
  const isHighQuality = output.value > 2;

  return (
      <div
          key={output.id}
          className="group w-full flex flex-col p-4 md:p-5 border border-gray-200 rounded-xl hover:shadow-lg transition-all duration-300 bg-white hover:border-gray-300 relative"
      >
        {/* 标题和类型标签行 */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-3">
          <a
              href={`/outputs?id=${output.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-base md:text-lg leading-tight line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors break-words hover:underline"
              title={output.title}
          >
            {output.title}
          </a>

          <div className="flex flex-row sm:flex-col items-start sm:items-end gap-2 flex-shrink-0">
            {/* 高质量成果标记 */}
            {isHighQuality && (
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 text-white px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap shadow-sm flex items-center gap-1">
              <Award className="h-3 w-3" />
              高质量成果
            </span>
            )}

            {/* 类型标签 */}
            <span className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap shadow-sm">
            {OutputTypes[output.type as keyof typeof OutputTypes] || output.type}
          </span>
          </div>
        </div>

        {/* 摘要 */}
        {output.abstractText && (
            <p
                className="text-sm text-gray-600 line-clamp-3 mb-4 flex-1 leading-relaxed break-words"
                title={output.abstractText}
            >
              {output.abstractText}
            </p>
        )}

        <div className="space-y-3 mt-auto pt-3 border-t border-gray-100">
          {/* 期刊信息 */}
          {isPaperType && (output.otherInfo?.journal || getJournalPartition()) && (
              <div className="bg-blue-50 rounded-lg p-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  {/* 期刊名称 */}
                  <div className="flex items-center gap-2 text-sm flex-1 min-w-0">
                    <FileText className="h-3.5 w-3.5 text-blue-600 flex-shrink-0" />
                    {output.otherInfo?.journal && (
                        <span
                            className="text-blue-800 font-medium truncate flex-1 break-words"
                            title={output.otherInfo.journal}
                        >
                    {output.otherInfo.journal}
                  </span>
                    )}
                  </div>

                  {/* 分区标签 */}
                  {getJournalPartition() && (
                      <div className="flex justify-start sm:justify-end flex-shrink-0">
                  <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap truncate max-w-full">
                    {getJournalPartition()}
                  </span>
                      </div>
                  )}
                </div>
              </div>
          )}

          {/* 提交者和时间 */}
          <div className="flex flex-col xs:flex-row xs:items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-gray-500 min-w-0 flex-1">
              <Users className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
              <span className="font-medium flex-shrink-0">提供者:</span>
              <span
                  className="truncate break-words min-w-0"
                  title={output.submitter?.realName || '未知'}
              >
              {output.submitter?.realName || '未知'}
            </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
              <Calendar className="h-3.5 w-3.5 text-orange-500" />
              <span className="text-nowrap">{formatDate(output.createdAt)}</span>
            </div>
          </div>

          {/* 数据集信息 */}
          {output.dataset?.titleCn && (
              <div className="flex items-center gap-2 text-sm text-gray-500 bg-gray-50 rounded-lg p-2.5">
                <Database className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                <span className="font-medium flex-shrink-0">基于数据集:</span>
                <span
                    className="truncate break-words flex-1 min-w-0 max-w-72"
                    title={`基于数据集: ${output.dataset.titleCn}`}
                >
              {output.dataset.titleCn}
            </span>
              </div>
          )}
        </div>
      </div>
  );
};