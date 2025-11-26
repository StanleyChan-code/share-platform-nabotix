import { FileText, BookOpen, Award } from "lucide-react";

/**
 * 获取研究成果类型的显示名称
 * @param type 成果类型
 * @returns 显示名称
 */
export const getOutputTypeDisplayName = (type: string): string => {
  switch (type) {
    case "project": return "项目/课题";
    case "paper": return "论文";
    case "publication": return "出版物";
    case "patent": return "专利";
    case "invention_patent": return "发明专利";
    case "utility_patent": return "实用新型专利";
    case "software_copyright": return "软件著作权";
    case "software": return "软件";
    case "other_award": return "其他获奖";
    default: return type;
  }
};

/**
 * 根据研究成果类型获取相应的图标名称
 * @param type 成果类型
 * @returns 图标名称
 */
export const getOutputTypeIcon = (type: string): string => {
  switch (type) {
    case "paper":
    case "publication":
      return "file-text";
    case "project":
      return "book-open";
    default:
      return "award";
  }
};

/**
 * 根据研究成果类型获取相应的图标组件
 * @param type 成果类型
 * @returns 图标组件
 */
export const getOutputTypeIconComponent = (type: string) => {
  const iconName = getOutputTypeIcon(type);
  
  switch (iconName) {
    case "file-text":
      return FileText;
    case "book-open":
      return BookOpen;
    default:
      return Award;
  }
};