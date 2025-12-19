import {FileText, BookOpen, Award} from "lucide-react";

/**
 * 获取研究成果类型的显示名称
 * @param type 成果类型
 * @returns 显示名称
 */
export const getOutputTypeDisplayName = (type: string): string => {
    switch (type.toUpperCase()) {
        case "PROJECT":
            return "项目/课题";
        case "PAPER":
            return "论文";
        case "PUBLICATION":
            return "出版物";
        case "PATENT":
            return "专利";
        case "INVENTION_PATENT":
            return "发明专利";
        case "UTILITY_PATENT":
            return "实用新型专利";
        case "SOFTWARE_COPYRIGHT":
            return "软件著作权";
        case "SOFTWARE":
            return "软件";
        case "OTHER_AWARD":
            return "其他获奖";
        default:
            return type;
    }
};

/**
 * 根据研究成果类型获取相应的图标名称
 * @param type 成果类型
 * @returns 图标名称
 */
export const getOutputTypeIcon = (type: string): string => {
    switch (type.toUpperCase()) {
        case "PAPER":
        case "PUBLICATION":
            return "file-text";
        case "PROJECT":
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
    const iconName = getOutputTypeIcon(type.toLowerCase());

    switch (iconName) {
        case "file-text":
            return FileText;
        case "book-open":
            return BookOpen;
        default:
            return Award;
    }
};

/**
 * 根据期刊分区来定义加载
 */
export const getJournalPartitionValue = (journalName: string) => {
    return journalName === "cas_1" || journalName === "jcr_q1" ? 4 :
                journalName === "cas_2" || journalName === "jcr_q2" ? 3 :
                    journalName === "cas_3" || journalName === "jcr_q3" ? 2 :
                        journalName === "cas_4" || journalName === "jcr_q4" ? 1 : 0;

}