import {Navigation} from "@/components/Navigation";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Badge} from "@/components/ui/badge";
import {Database, Shield, Users, Award, FileText, Globe, CheckCircle, Target} from "lucide-react";
import {useEffect} from "react";
import {supabase} from "@/integrations/supabase/client.ts";

const About = () => {
    useEffect(() => {

    }, []);


    return (
        <div className="min-h-screen bg-background">
            <Navigation/>

            <main className="container mx-auto py-6 space-y-8">
                {/* Hero Section */}
                <div className="text-center space-y-6">
                    <div
                        className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                        <Database className="h-4 w-4"/>
                        华西临床研究数据共享平台
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight">
                        推动临床研究数据开放共享
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                        基于OMOP CDM标准的安全、标准化、协作式临床研究数据共享平台，
                        严格遵循数据去标识化规范，为医学研究创新提供高质量数据支撑。
                    </p>
                </div>

                {/* Mission & Vision */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Target className="h-5 w-5 text-primary"/>
                                使命愿景
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold mb-2">我们的使命</h4>
                                <p className="text-sm text-muted-foreground">
                                    建立安全可信的临床研究数据共享生态，打破数据孤岛，
                                    促进跨机构协作，推动循证医学发展和精准医疗创新。
                                </p>
                            </div>
                            <div>
                                <h4 className="font-semibold mb-2">我们的愿景</h4>
                                <p className="text-sm text-muted-foreground">
                                    成为国内领先的临床研究数据共享平台，为医学研究者提供
                                    高质量数据资源，加速医学科学发现和临床应用转化。
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CheckCircle className="h-5 w-5 text-primary"/>
                                核心价值
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-green-600"/>
                                    <span className="text-sm">数据安全与隐私保护</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-blue-600"/>
                                    <span className="text-sm">标准化数据管理</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Users className="h-4 w-4 text-purple-600"/>
                                    <span className="text-sm">开放协作共享</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Award className="h-4 w-4 text-orange-600"/>
                                    <span className="text-sm">学术诚信与质量</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Platform Features */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">平台特色</h2>
                        <p className="text-muted-foreground">
                            基于国际标准，提供全流程数据管理和分析服务
                        </p>
                    </div>

                    <div className="grid gap-6 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Database className="h-5 w-5 text-primary"/>
                                    OMOP CDM 标准
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• 遵循国际通用观察性健康数据标准</li>
                                    <li>• 标准化数据模型和术语编码</li>
                                    <li>• 支持跨机构数据整合分析</li>
                                    <li>• 提升数据质量和可重复性</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <Shield className="h-5 w-5 text-primary"/>
                                    数据安全保护
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• 严格的去标识化处理流程</li>
                                    <li>• 多层级访问权限控制</li>
                                    <li>• 端到端数据加密传输</li>
                                    <li>• 完整的数据使用审计追踪</li>
                                </ul>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg">
                                    <FileText className="h-5 w-5 text-primary"/>
                                    内置统计分析
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    <li>• 自动化描述性统计分析</li>
                                    <li>• 交互式数据可视化展示</li>
                                    <li>• 人口学特征分布图表</li>
                                    <li>• 支持自定义统计指标</li>
                                </ul>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Process Flow */}
                <div className="space-y-6">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold mb-4">平台流程</h2>
                        <p className="text-muted-foreground">
                            从数据上传到成果产出的完整流程管理
                        </p>
                    </div>

                    <Card>
                        <CardContent className="p-6">
                            <div className="grid gap-6 md:grid-cols-4">
                                <div className="text-center space-y-3">
                                    <div
                                        className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                        <Database className="h-6 w-6"/>
                                    </div>
                                    <h4 className="font-semibold">数据上传</h4>
                                    <p className="text-xs text-muted-foreground">
                                        数据提供方上传标准化数据集，通过去标识化检查
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div
                                        className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                        <Shield className="h-6 w-6"/>
                                    </div>
                                    <h4 className="font-semibold">审核验证</h4>
                                    <p className="text-xs text-muted-foreground">
                                        平台管理员审核数据质量，导师验证提供方身份
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div
                                        className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                        <Users className="h-6 w-6"/>
                                    </div>
                                    <h4 className="font-semibold">申请使用</h4>
                                    <p className="text-xs text-muted-foreground">
                                        研究人员提交数据申请，经多级审核后获得访问权限
                                    </p>
                                </div>

                                <div className="text-center space-y-3">
                                    <div
                                        className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
                                        <Award className="h-6 w-6"/>
                                    </div>
                                    <h4 className="font-semibold">成果产出</h4>
                                    <p className="text-xs text-muted-foreground">
                                        研究人员上传基于数据产生的论文、专利等成果
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Compliance & Standards */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5 text-primary"/>
                            合规标准
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <h4 className="font-semibold">国际标准</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">OMOP CDM</Badge>
                                    <Badge variant="outline">FAIR原则</Badge>
                                    <Badge variant="outline">HIPAA</Badge>
                                    <Badge variant="outline">ICH-GCP</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    严格遵循国际数据管理和隐私保护标准，确保数据共享的合规性和安全性。
                                </p>
                            </div>

                            <div className="space-y-3">
                                <h4 className="font-semibold">国内法规</h4>
                                <div className="flex flex-wrap gap-2">
                                    <Badge variant="outline">数据安全法</Badge>
                                    <Badge variant="outline">个人信息保护法</Badge>
                                    <Badge variant="outline">网络安全法</Badge>
                                    <Badge variant="outline">临床试验管理规范</Badge>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    全面符合中国法律法规要求，建立完善的数据治理和风险管控体系。
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Contact Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>联系我们</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-6 md:grid-cols-2">
                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">平台管理团队</h4>
                                    <p className="text-sm text-muted-foreground">
                                        四川大学华西医院<br/>
                                        临床研究管理中心<br/>
                                        成都市国学巷37号
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">技术支持</h4>
                                    <p className="text-sm text-muted-foreground">
                                        邮箱：support@nabotix-platform.org<br/>
                                        电话：028-85422114<br/>
                                        工作时间：周一至周五 9:00-17:00
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold mb-2">合作洽谈</h4>
                                    <p className="text-sm text-muted-foreground">
                                        如您希望参与平台建设或开展合作研究，<br/>
                                        欢迎通过邮箱联系我们：<br/>
                                        cooperation@nabotix-platform.org
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2">用户反馈</h4>
                                    <p className="text-sm text-muted-foreground">
                                        我们重视您的意见和建议，<br/>
                                        请发送至：feedback@nabotix-platform.org<br/>
                                        帮助我们不断完善平台服务
                                    </p>
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