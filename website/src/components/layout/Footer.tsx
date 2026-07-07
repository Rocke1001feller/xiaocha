import { Heart, Mail, MessageCircle, Twitter, Github } from 'lucide-react';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { href: "#features", label: "核心特性" },
      { href: "#demo", label: "使用演示" },
      { href: "#download", label: "下载中心" },
      { href: "#", label: "更新日志" },
    ],
    support: [
      { href: "#", label: "使用帮助" },
      { href: "#", label: "常见问题" },
      { href: "#", label: "联系我们" },
      { href: "#", label: "用户反馈" },
    ],
    company: [
      { href: "#story", label: "品牌故事" },
      { href: "#", label: "关于我们" },
      { href: "#", label: "隐私政策" },
      { href: "#", label: "服务条款" },
    ],
  };

  const socialLinks = [
    { icon: <Twitter className="w-5 h-5" />, href: "#", label: "Twitter" },
    { icon: <Github className="w-5 h-5" />, href: "#", label: "Github" },
    { icon: <Mail className="w-5 h-5" />, href: "#", label: "Email" },
    { icon: <MessageCircle className="w-5 h-5" />, href: "#", label: "Contact" },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-orange-50 border-t border-orange-100">
      <div className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-xl">🌱</span>
              </div>
              <div>
                <span className="text-xl font-bold text-gray-900">小猹</span>
                <div className="text-xs font-medium text-primary-600">
                  查单词，用小猹
                </div>
              </div>
            </div>

            <p className="text-gray-600 leading-relaxed mb-6">
              选中任何不懂的单词，立刻获得明明白白的解释。像闰土在瓜田里一样，充满好奇心地探索知识世界。
            </p>

            <div className="flex space-x-3">
              {socialLinks.map((social, index) => (
                <a
                  key={index}
                  href={social.href}
                  className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 border border-gray-200 hover:border-primary-200 hover-lift"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">产品</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-primary-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">支持</h4>
            <ul className="space-y-3">
              {footerLinks.support.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-primary-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h4 className="font-bold text-gray-900 mb-6">公司</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link, index) => (
                <li key={index}>
                  <a
                    href={link.href}
                    className="text-gray-600 hover:text-primary-600 transition-colors duration-200 flex items-center group"
                  >
                    <span className="w-1 h-1 bg-primary-400 rounded-full mr-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Newsletter Section */}
        <div className="bg-white rounded-2xl p-8 mb-12 border border-orange-100">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-6 h-6 text-primary-500 mr-2" />
              <h3 className="text-xl font-bold text-gray-900">关注小猹的成长</h3>
            </div>
            <p className="text-gray-600 mb-6">
              获取最新的功能更新和知识探索技巧
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <input
                type="email"
                placeholder="输入您的邮箱"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200 transition-all duration-200"
              />
              <button className="btn-primary px-6 py-3">
                订阅
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-orange-100 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 text-gray-500 text-sm mb-4 md:mb-0">
              <span>© {currentYear} 小猹. 保留所有权利.</span>
              <span className="text-primary-500">🌱</span>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary-600 transition-colors duration-200">隐私政策</a>
              <a href="#" className="hover:text-primary-600 transition-colors duration-200">服务条款</a>
              <a href="#" className="hover:text-primary-600 transition-colors duration-200">Cookie设置</a>
            </div>
          </div>
        </div>

        {/* Brand Tagline */}
        <div className="text-center mt-8">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 rounded-full">
            <span className="text-sm font-medium text-primary-700">
              查单词，用小猹 · 选中，即懂
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};