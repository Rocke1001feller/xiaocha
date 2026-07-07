import { useState } from 'react';

export const Download = () => {
  const [selectedPlatform, setSelectedPlatform] = useState('chrome');

  const platforms = [
    {
      id: 'chrome',
      name: 'Chrome 浏览器',
      downloadUrl: '/assets/chrome-extension.zip',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      ),
      description: '支持 Chrome、Edge、360安全浏览器等基于Chromium的浏览器',
      badge: '推荐',
      badgeColor: 'bg-green-500/20 text-green-400 border-green-500/30'
    },
    {
      id: 'mobile',
      name: '手机应用',
      icon: (
        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
        </svg>
      ),
      description: 'Android 和 iOS 应用，随时随地查看收藏的知识内容',
      badge: '即将推出',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    }
  ];

  const features = [
    '完全免费使用',
    '无广告干扰',
    '数据安全加密',
    '跨设备同步',
    '持续更新优化',
    '专业客服支持'
  ];

  return (
    <section id="download" className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              开始您的 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">知识探索之旅</span>
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              选择适合您的平台，立即体验小猹带来的全新阅读理解方式
            </p>
          </div>

          {/* Platform Selection */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex p-1 bg-slate-800 rounded-xl">
              {platforms.map((platform) => (
                <button
                  key={platform.id}
                  onClick={() => setSelectedPlatform(platform.id)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    selectedPlatform === platform.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  {platform.icon}
                  <span>{platform.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Download Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className={`relative p-8 rounded-2xl border transition-all duration-300 ${
                  selectedPlatform === platform.id
                    ? 'bg-gradient-to-br from-blue-900/30 to-purple-900/30 border-blue-500/50 shadow-2xl shadow-blue-500/20'
                    : 'bg-slate-800/50 border-slate-700/50 opacity-75'
                }`}
              >
                {platform.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-medium border ${platform.badgeColor}`}>
                    {platform.badge}
                  </div>
                )}

                <div className="flex items-center space-x-4 mb-6">
                  <div className={`p-3 rounded-xl ${
                    selectedPlatform === platform.id ? 'bg-blue-600' : 'bg-slate-700'
                  }`}>
                    {platform.icon}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">{platform.name}</h3>
                    <p className="text-slate-400 text-sm">{platform.description}</p>
                  </div>
                </div>

                {platform.id === 'chrome' ? (
                  <a
                    href="/assets/chrome-extension.zip"
                    download="chrome-extension.zip"
                    className={`block w-full py-3 rounded-lg font-medium transition-all duration-200 text-center ${
                      selectedPlatform === platform.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    立即下载
                  </a>
                ) : (
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-all duration-200 ${
                      selectedPlatform === platform.id
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    预约通知
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {features.map((feature, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"
              >
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-slate-300">{feature}</span>
              </div>
            ))}
          </div>

          {/* Installation Guide */}
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl border border-slate-700/50 p-8 mb-16">
            <h3 className="text-2xl font-semibold text-white mb-8 text-center">安装指南</h3>

            {selectedPlatform === 'chrome' ? (
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                    1
                  </div>
                  <h4 className="font-medium text-white mb-2">访问应用商店</h4>
                  <p className="text-slate-400 text-sm">打开Chrome Web Store</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                    2
                  </div>
                  <h4 className="font-medium text-white mb-2">搜索小猹</h4>
                  <p className="text-slate-400 text-sm">在商店中搜索"小猹"</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                    3
                  </div>
                  <h4 className="font-medium text-white mb-2">添加到浏览器</h4>
                  <p className="text-slate-400 text-sm">点击"添加至Chrome"</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold">
                    4
                  </div>
                  <h4 className="font-medium text-white mb-2">开始使用</h4>
                  <p className="text-slate-400 text-sm">选中任意文字体验</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h4 className="text-xl font-medium text-white mb-4">手机应用即将推出</h4>
                <p className="text-slate-300 mb-6">输入您的邮箱，我们会在应用发布时第一时间通知您</p>
                <div className="max-w-md mx-auto flex gap-3">
                  <input
                    type="email"
                    placeholder="输入您的邮箱地址"
                    className="flex-1 px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                  <button className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium">
                    通知我
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Support Section */}
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-white mb-6">需要帮助？</h3>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                使用帮助
              </button>
              <button className="px-6 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
                <svg className="w-5 h-5 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                联系客服
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};