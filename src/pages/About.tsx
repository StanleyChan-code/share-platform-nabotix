import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Shield, Users, Award, FileText, Globe, CheckCircle, Target, Mail, Phone, MapPin, Heart, Zap, Lock } from "lucide-react";
import { useEffect } from "react";

const About = () => {
    useEffect(() => {
        // 可以在这里添加页面加载时的逻辑
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50/30 to-blue-50/10">
            <Navigation/>

            <main className="container mx-auto px-4 space-y-4 max-w-6xl">
                {/* Hero Section */}
                <div className="text-center space-y-6 py-8">
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-semibold shadow-sm">
                        <Database className="h-5 w-5"/>
                        华西临床研究数据共享平台
                    </div>
                    <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                        推动临床研究数据开放共享
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                        基于OMOP CDM标准的安全、标准化、协作式临床研究数据共享平台，
                        严格遵循数据去标识化规范，为医学研究创新提供高质量数据支撑。
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid gap-6 lg:grid-cols-2">
                    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <Target className="h-6 w-6 text-blue-600"/>
                                </div>
                                使命愿景
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2 text-blue-800">
                                    <Zap className="h-5 w-5"/>
                                    我们的使命
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    建立安全可信的临床研究数据共享生态，打破数据孤岛，
                                    促进跨机构协作，推动循证医学发展和精准医疗创新。
                                </p>
                            </div>
                            <div className="space-y-3">
                                <h4 className="font-semibold text-lg flex items-center gap-2 text-green-800">
                                    <Heart className="h-5 w-5"/>
                                    我们的愿景
                                </h4>
                                <p className="text-muted-foreground leading-relaxed">
                                    成为国内领先的临床研究数据共享平台，为医学研究者提供
                                    高质量数据资源，加速医学科学发现和临床应用转化。
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-white to-green-50/30 border-green-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center gap-3 text-xl">
                                <div className="p-2 bg-green-100 rounded-lg">
                                    <CheckCircle className="h-6 w-6 text-green-600"/>
                                </div>
                                核心价值
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-green-200/30">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Shield className="h-5 w-5 text-green-600"/>
                                    </div>
                                    <span className="font-medium text-green-800">数据安全与隐私保护</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-blue-200/30">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Database className="h-5 w-5 text-blue-600"/>
                                    </div>
                                    <span className="font-medium text-blue-800">标准化数据管理</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-purple-200/30">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <Users className="h-5 w-5 text-purple-600"/>
                                    </div>
                                    <span className="font-medium text-purple-800">开放协作共享</span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-white/50 rounded-lg border border-orange-200/30">
                                    <div className="p-2 bg-orange-100 rounded-lg">
                                        <Award className="h-5 w-5 text-orange-600"/>
                                    </div>
                                    <span className="font-medium text-orange-800">学术诚信与质量</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Platform Features */}
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                            平台特色
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            基于国际标准，提供全流程数据管理和分析服务
                        </p>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <Card className="bg-gradient-to-br from-white to-blue-50/20 border-blue-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Database className="h-5 w-5 text-blue-600"/>
                                    </div>
                                    OMOP CDM 标准
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>遵循国际通用观察性健康数据标准</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>标准化数据模型和术语编码</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>支持跨机构数据整合分析</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>提升数据质量和可重复性</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-green-50/20 border-green-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Lock className="h-5 w-5 text-green-600"/>
                                    </div>
                                    数据安全保护
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>严格的去标识化处理流程</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>多层级访问权限控制</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>端到端数据加密传输</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>完整的数据使用审计追踪</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card className="bg-gradient-to-br from-white to-purple-50/20 border-purple-200/50 shadow-lg hover:shadow-xl transition-all duration-300 h-full">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-3 text-lg">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="h-5 w-5 text-purple-600"/>
                                    </div>
                                    内置统计分析
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3 text-muted-foreground">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>自动化描述性统计分析</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>交互式数据可视化展示</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>人口学特征分布图表</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0"/>
                                        <span>支持自定义统计指标</span>
                                    </li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Process Flow */}
                <div className="space-y-8">
                    <div className="text-center space-y-4">
                        <h2 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
                            平台流程
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            从数据上传到成果产出的完整流程管理
                        </p>
                    </div>

                    <Card className="bg-gradient-to-br from-white to-orange-50/20 border-orange-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                        <CardContent className="p-8">
                            <div className="grid gap-8 lg:grid-cols-4">
                                {[
                                    { icon: Database, title: "数据上传", desc: "数据提供方上传标准化数据集，通过去标识化检查", color: "blue" },
                                    { icon: Shield, title: "审核验证", desc: "平台管理员审核数据质量，导师验证提供方身份", color: "green" },
                                    { icon: Users, title: "申请使用", desc: "研究人员提交数据申请，经多级审核后获得访问权限", color: "purple" },
                                    { icon: Award, title: "成果产出", desc: "研究人员上传基于数据产生的论文、专利等成果", color: "orange" }
                                ].map((step, index) => (
                                    <div key={index} className="text-center space-y-4 relative">
                                        {/* 连接线 */}
                                        {index < 3 && (
                                            <div className="hidden lg:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-green-200 -z-10"/>
                                        )}

                                        <div className={`w-16 h-16 bg-${step.color}-100 text-${step.color}-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg`}>
                                            <step.icon className="h-8 w-8"/>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className={`w-3 h-3 bg-${step.color}-500 rounded-full`}></div>
                                                <h4 className="font-semibold text-lg">{step.title}</h4>
                                            </div>
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                {step.desc}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Compliance & Standards */}
                <Card className="bg-gradient-to-br from-white to-indigo-50/20 border-indigo-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                            <div className="p-2 bg-indigo-100 rounded-lg">
                                <Globe className="h-6 w-6 text-indigo-600"/>
                            </div>
                            合规标准
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2 text-indigo-800">
                                    <Globe className="h-5 w-5"/>
                                    国际标准
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {["OMOP CDM", "FAIR原则", "HIPAA", "ICH-GCP"].map((standard) => (
                                        <Badge key={standard} variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-200">
                                            {standard}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    严格遵循国际数据管理和隐私保护标准，确保数据共享的合规性和安全性。
                                </p>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2 text-blue-800">
                                    <Shield className="h-5 w-5"/>
                                    国内法规
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {["数据安全法", "个人信息保护法", "网络安全法", "临床试验管理规范"].map((law) => (
                                        <Badge key={law} variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                                            {law}
                                        </Badge>
                                    ))}
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    全面符合中国法律法规要求，建立完善的数据治理和风险管控体系。
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card className="bg-gradient-to-br from-white to-gray-50/20 border-gray-200/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
                    <CardHeader>
                        <CardTitle className="text-xl">联系我们</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-8 lg:grid-cols-2">
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                                        <MapPin className="h-5 w-5 text-blue-600"/>
                                        平台管理团队
                                    </h4>
                                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                四川大学华西医院<br/>
                                                临床研究管理中心<br/>
                                                成都市国学巷37号
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                                        <Phone className="h-5 w-5 text-green-600"/>
                                        技术支持
                                    </h4>
                                    <div className="flex items-start gap-3 p-3 bg-green-50/50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                邮箱：support@nabotix-platform.org<br/>
                                                电话：028-85422114<br/>
                                                工作时间：周一至周五 9:00-17:00
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                                        <Mail className="h-5 w-5 text-purple-600"/>
                                        合作洽谈
                                    </h4>
                                    <div className="flex items-start gap-3 p-3 bg-purple-50/50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                如您希望参与平台建设或开展合作研究，<br/>
                                                欢迎通过邮箱联系我们：<br/>
                                                <strong>cooperation@nabotix-platform.org</strong>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="font-semibold text-lg flex items-center gap-2 text-gray-800">
                                        <Users className="h-5 w-5 text-orange-600"/>
                                        用户反馈
                                    </h4>
                                    <div className="flex items-start gap-3 p-3 bg-orange-50/50 rounded-lg">
                                        <div className="flex-1">
                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                我们重视您的意见和建议，<br/>
                                                请发送至：<strong>feedback@nabotix-platform.org</strong><br/>
                                                帮助我们不断完善平台服务
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
};

export default About;