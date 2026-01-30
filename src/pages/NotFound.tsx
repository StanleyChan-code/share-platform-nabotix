import { useLocation, useNavigate, Link } from "react-router-dom";
import { useEffect, useMemo, useCallback } from "react";
import { Navigation } from "@/components/Navigation";
import { Search, Home, Database, Award, Info, ArrowLeft, ExternalLink, Mail, Phone, Clock, Users, MessageSquare, Building } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QuickLink {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}

interface ContactInfo {
  title: string;
  content: string[];
  icon: React.ComponentType<{ className?: string }>;
  link?: {
    type: "email" | "phone";
    value: string;
  };
}

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const quickLinks = useMemo<QuickLink[]>(
      () => [
        {
          name: "首页",
          href: "/",
          icon: Home,
          description: "返回平台主页"
        },
        {
          name: "数据集",
          href: "/datasets",
          icon: Database,
          description: "浏览可用数据集"
        },
        {
          name: "研究成果",
          href: "/outputs",
          icon: Award,
          description: "查看研究成果"
        },
        {
          name: "个人中心",
          href: "/profile",
          icon: Info,
          description: "管理个人信息"
        },
      ],
      []
  );

  const contactInfos = useMemo<ContactInfo[]>(
      () => [
        {
          title: "平台管理团队",
          content: [
            "四川大学华西医院",
            "临床研究管理中心",
            "成都市国学巷37号"
          ],
          icon: Building
        }
      ],
      []
  );

  useEffect(() => {
    const errorDetails = {
      type: "404_NOT_FOUND",
      path: location.pathname,
      timestamp: new Date().toISOString(),
    };

    console.error("404 Error:", errorDetails);

    if (process.env.NODE_ENV === "production") {
      // 错误上报逻辑
    }
  }, [location]);

  const handleGoBack = useCallback(() => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  }, [navigate]);

  const getSuggestedPage = useCallback(() => {
    const path = location.pathname.toLowerCase();

    if (path.includes("dataset") || path.includes("data")) {
      return { href: "/datasets", name: "数据集" };
    }
    if (path.includes("output") || path.includes("research")) {
      return { href: "/outputs", name: "研究成果" };
    }
    if (path.includes("about")) {
      return { href: "/about", name: "关于平台" };
    }

    return null;
  }, [location.pathname]);

  const handleContactClick = (contact: ContactInfo) => {
    if (contact.link?.type === "email") {
      window.location.href = `mailto:${contact.link.value}`;
    } else if (contact.link?.type === "phone") {
      window.location.href = `tel:${contact.link.value.replace(/[^\d+]/g, '')}`;
    }
  };

  const suggestedPage = getSuggestedPage();

  return (
      <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-white">
        <Navigation />

        <main className="container mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
          <div className="text-center max-w-6xl w-full">
            {/* 404 主内容区 */}
            <div className="mb-16">
              <div className="relative inline-block mb-8" role="presentation">
                <div
                    className="w-32 h-32 bg-gradient-to-br from-blue-50 to-blue-100 rounded-full flex items-center justify-center mx-auto shadow-lg"
                    aria-hidden="true"
                >
                  <div className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                    404
                  </div>
                </div>
                <div
                    className="absolute -right-2 -bottom-2 w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white"
                    aria-hidden="true"
                >
                  <Search className="h-6 w-6 text-white" />
                </div>
              </div>

              <header className="mb-8">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                  页面未找到
                </h1>

                <p className="text-lg text-gray-600 mb-4">
                  抱歉，您访问的页面 <code className="text-blue-600 font-mono bg-blue-50 px-2 py-1 rounded text-sm">"{location.pathname}"</code> 不存在或已被移除。
                </p>

                {suggestedPage && (
                    <div className="inline-flex items-center gap-2 text-blue-700 bg-blue-50 px-4 py-2 rounded-lg mb-4">
                      <Info className="h-4 w-4" />
                      <span className="text-sm">
                    您要找的是 <strong>{suggestedPage.name}</strong> 吗？
                  </span>
                    </div>
                )}
              </header>

              {/* 主要操作按钮 */}
              <section className="mb-12" aria-label="主要操作">
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                  <Button
                      onClick={handleGoBack}
                      variant="outline"
                      size="lg"
                      className="border-gray-300 hover:bg-gray-50"
                  >
                    <ArrowLeft className="h-5 w-5 mr-2" />
                    返回上一页
                  </Button>

                  <Button
                      asChild
                      variant="default"
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg"
                  >
                    <Link to="/">
                      <Home className="h-5 w-5 mr-2" />
                      返回首页
                    </Link>
                  </Button>

                  {suggestedPage && (
                      <Button
                          asChild
                          variant="secondary"
                          size="lg"
                          className="bg-gradient-to-r from-blue-50 to-blue-100 text-blue-800 hover:from-blue-100 hover:to-blue-200 border border-blue-200"
                      >
                        <Link to={suggestedPage.href}>
                          前往{suggestedPage.name}
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                  )}
                </div>
              </section>
            </div>

            <div className="grid lg:grid-cols-2 gap-12">
              {/* 快速链接 */}
              <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
                  <Home className="h-5 w-5 text-blue-600" />
                  快速导航
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {quickLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                        <Button
                            key={link.href}
                            asChild
                            variant="outline"
                            className="h-auto py-4 px-6 flex items-center gap-3 hover:shadow-md transition-shadow duration-200 bg-white border-gray-200 hover:border-blue-300 justify-start"
                        >
                          <Link to={link.href}>
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600">
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <span className="font-medium text-gray-900 block">{link.name}</span>
                              {link.description && (
                                  <span className="text-xs text-gray-500">{link.description}</span>
                              )}
                            </div>
                          </Link>
                        </Button>
                    );
                  })}
                </div>
              </section>

              {/* 联系我们 */}
              <section className="bg-gradient-to-br from-blue-50/50 to-blue-100/30 rounded-2xl p-6 shadow-sm border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-white rounded-lg shadow-sm">
                    <MessageSquare className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">联系我们</h2>
                    <p className="text-sm text-gray-600 mt-1">获取帮助与支持</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {contactInfos.map((contact, index) => {
                    const Icon = contact.icon;
                    return (
                        <div
                            key={index}
                            className={`p-4 rounded-xl bg-white/80 backdrop-blur-sm border ${
                                contact.link
                                    ? "cursor-pointer hover:shadow-md transition-all duration-200 hover:border-blue-300 hover:bg-white"
                                    : "border-gray-100"
                            }`}
                            onClick={() => contact.link && handleContactClick(contact)}
                            role={contact.link ? "button" : "article"}
                            tabIndex={contact.link ? 0 : -1}
                            onKeyDown={(e) => {
                              if (contact.link && (e.key === 'Enter' || e.key === ' ')) {
                                handleContactClick(contact);
                              }
                            }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              <Icon className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-2">{contact.title}</h3>
                              <div className="space-y-1">
                                {contact.content.map((line, lineIndex) => (
                                    <p
                                        key={lineIndex}
                                        className="text-sm text-gray-600 leading-relaxed"
                                    >
                                      {line}
                                      {lineIndex === contact.content.length - 1 && contact.link && (
                                          <span className="block font-medium text-blue-600 mt-1">
                                    {contact.link.value}
                                            {contact.link.type === 'email' && (
                                                <Mail className="h-3 w-3 inline ml-1" />
                                            )}
                                  </span>
                                      )}
                                    </p>
                                ))}
                              </div>
                            </div>
                            {contact.link && (
                                <div className="text-blue-500">
                                  {contact.link.type === 'email' ? (
                                      <Mail className="h-4 w-4" />
                                  ) : (
                                      <Phone className="h-4 w-4" />
                                  )}
                                </div>
                            )}
                          </div>
                        </div>
                    );
                  })}
                </div>
              </section>
            </div>

            {/* 底部提示 */}
            <footer className="mt-12 pt-8 border-t border-gray-200">
              <div className="text-center text-sm text-gray-500">
                <p className="mb-2">
                  如果您认为这个页面应该存在，请通过上方联系方式反馈给我们
                </p>
                <p>
                  感谢您对 <span className="text-blue-600 font-medium">老年疾病国家临床医学研究中心（华西）</span> 的支持
                </p>
              </div>
            </footer>
          </div>
        </main>
      </div>
  );
};

export default NotFound;