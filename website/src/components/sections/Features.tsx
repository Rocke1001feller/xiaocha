import { MousePointer, Sparkles, BookOpen, Zap, Heart, Globe } from 'lucide-react';

export const Features = () => {
  const coreFeatures = [
    {
      icon: <MousePointer className="w-8 h-8" />,
      title: '选中即触发',
      description: '告别繁琐的复制粘贴。在任何网页选中不懂的单词，小猹立刻出现，带来即时的理解满足感。',
      color: 'primary',
      example: '传统方式：复制→打开词典→粘贴→搜索\n小猹方式：选中→懂了'
    },
    {
      icon: <Sparkles className="w-8 h-8" />,
      title: '解释超清晰',
      description: '不是冰冷的机器翻译，而是像朋友一样用大白话解释。每个词都变得亲切易懂，瞬间记住。',
      color: 'green',
      example: '"serendipity" 不是"意外发现珍奇事物的运气"，而是"走路捡到宝的惊喜"'
    },
    {
      icon: <span className="text-2xl">🌱</span>,
      title: '陪伴感十足',
      description: '小猹就像闰土在瓜田里的伙伴，陪你探索知识的海洋。让每一次学习都充满童趣和发现的快乐。',
      color: 'orange',
      example: '查单词，用小猹——像闰土一样对世界充满好奇'
    }
  ];

  const additionalFeatures = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: '响应速度极快',
      description: '选中文字的瞬间，解释就已经出现。零延迟的理解体验，让阅读流畅不被打断。'
    },
    {
      icon: <BookOpen className="w-6 h-6" />,
      title: '知识深度解析',
      description: '从词性词源到使用场景，提供全方位的知识背景，让你真正理解而不只是认识。'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: '支持多种语言',
      description: '中英文互译，多语言学习。无论什么语种的内容，小猹都能帮你理解透彻。'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Core Features */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-6">
            <Heart className="w-4 h-4 mr-2" />
            核心特性
          </div>
          <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            为什么<span className="gradient-text">小猹</span>与众不同？
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            我们重新定义了查单词的体验。不只是工具，更是你探索知识世界的温暖伙伴。
          </p>
        </div>

        {/* Main Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {coreFeatures.map((feature, index) => (
            <div
              key={index}
              className={`feature-card group relative ${
                feature.color === 'primary' ? 'from-primary-50 to-orange-50 border-primary-200' :
                feature.color === 'green' ? 'from-green-50 to-emerald-50 border-green-200' :
                'from-orange-50 to-yellow-50 border-orange-200'
              }`}
            >
              {/* Floating icon */}
              <div className="absolute -top-6 left-6">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                  feature.color === 'primary' ? 'bg-primary-500 text-white' :
                  feature.color === 'green' ? 'bg-green-500 text-white' :
                  'bg-orange-500 text-white'
                }`}>
                  {feature.icon}
                </div>
              </div>

              <div className="pt-10">
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  {feature.description}
                </p>

                {/* Example */}
                <div className="bg-white/70 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-600 font-mono">
                    {feature.example}
                  </p>
                </div>
              </div>

              {/* Hover effect decoration */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Sparkles className="w-6 h-6 text-primary-400 animate-pulse" />
              </div>
            </div>
          ))}
        </div>

        {/* Additional Features */}
        <div className="bg-gray-50 rounded-3xl p-8 mb-16">
          <h3 className="text-2xl font-bold text-gray-900 text-center mb-8">
            更多贴心功能
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-gray-200 flex-shrink-0">
                  <div className="text-primary-500">
                    {feature.icon}
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-primary-50 to-red-50 rounded-2xl p-8 border border-primary-200">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              准备好体验<span className="gradient-text">选中即懂</span>了吗？
            </h3>
            <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
              像闰土在瓜田里发现猹的踪迹一样，让每一次阅读都充满发现的惊喜。
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/assets/chrome-extension.zip"
                download="chrome-extension.zip"
                className="btn-primary inline-block"
              >
                <MousePointer className="w-5 h-5 mr-2" />
                免费下载 Chrome 插件
              </a>
              <button className="btn-secondary">
                <BookOpen className="w-5 h-5 mr-2" />
                查看使用教程
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};