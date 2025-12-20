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
        case "INVENTION_PATENT":
            return "发明专利";
        case "UTILITY_PATENT":
            return "实用新型专利";
        case "SOFTWARE_COPYRIGHT":
            return "软件著作权";
        case "OTHER_AWARD":
            return "其他获奖";
        default:
            return type;
    }
};

export const getAllOutputTypes = () => {
    return [
        {name: "项目/课题", value: "PROJECT"},
        {name: "论文", value: "PAPER"},
        {name: "出版物", value: "PUBLICATION"},
        {name: "发明专利", value: "INVENTION_PATENT"},
        {name: "实用新型专利", value: "UTILITY_PATENT"},
        {name: "软件著作权", value: "SOFTWARE_COPYRIGHT"},
        {name: "其他获奖", value: "OTHER_AWARD"}
    ]
}

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
    return journalName === "cas_1" || journalName === "jcr_q1" ? 2 :
        journalName === "cas_2" || journalName === "jcr_q2" ? 1 :
            journalName === "cas_3" || journalName === "jcr_q3" ? 0 :
                journalName === "cas_4" || journalName === "jcr_q4" ? 0 : 0;

}

/**
 * 获取期刊分区名称
 */
export const getJournalPartitionName = (journalName: string) => {

    switch (journalName.toLowerCase()) {
        case "cas_1":
            return "中科院 一区";
        case "cas_2":
            return "中科院 二区";
        case "cas_3":
            return "中科院 三区";
        case "cas_4":
            return "中科院 四区";
        case "jcr_q1":
            return "JCR Q1";
        case "jcr_q2":
            return "JCR Q2";
        case "jcr_q3":
            return "JCR Q3";
        case "jcr_q4":
            return "JCR Q4";
        case "other":
            return "其他";
        default:
            return "-";
    }
}

export const getAllJournalPartitionTypes = () => {
    return [
        {name: "中科院 分区", value: "cas"},
        {name: "JCR 分区", value: "jcr"},
        {name: "其他", value: "other"}
    ]

}

/**
 * 获取全部期刊分区名称
 */
export const getAllJournalPartitionName = (partitionType?: string) => {
    let jp: { name: string, value: string }[];
    if (partitionType === "cas") {
        jp = [
            {name: "中科院 一区", value: "cas_1"},
            {name: "中科院 二区", value: "cas_2"},
            {name: "中科院 三区", value: "cas_3"},
            {name: "中科院 四区", value: "cas_4"},
        ]
    } else if (partitionType === "jcr") {
        jp = [
            {name: "JCR Q1", value: "jcr_q1"},
            {name: "JCR Q2", value: "jcr_q2"},
            {name: "JCR Q3", value: "jcr_q3"},
            {name: "JCR Q4", value: "jcr_q4"}
        ]
    } else if (partitionType === "other") {
        jp = [
            {name: "其他", value: "other"}
        ]
    } else {
        jp = [
            {name: "中科院 一区", value: "cas_1"},
            {name: "中科院 二区", value: "cas_2"},
            {name: "中科院 三区", value: "cas_3"},
            {name: "中科院 四区", value: "cas_4"},
            {name: "JCR Q1", value: "jcr_q1"},
            {name: "JCR Q2", value: "jcr_q2"},
            {name: "JCR Q3", value: "jcr_q3"},
            {name: "JCR Q4", value: "jcr_q4"},
            {name: "其他", value: "other"}
        ]
    }
    return jp;
}