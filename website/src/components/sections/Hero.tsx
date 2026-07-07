import { useState } from 'react';
import { Download, Search, Sparkles, MousePointer } from 'lucide-react';

export const Hero = () => {
  const [selectedText, setSelectedText] = useState('');
  const [showExplanation, setShowExplanation] = useState(false);

  const handleTextSelect = () => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim()) {
      setSelectedText(selection.toString());
      setShowExplanation(true);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden cha-gradient-bg">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-red-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1.5s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-6 text-center">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-8 hover-lift">
            <Sparkles className="w-4 h-4 mr-2" />
            即时知识内化工具
          </div>

          {/* Main Heading */}
          <div className="mb-8">
            <h1 className="text-6xl md:text-8xl font-bold text-gray-900 mb-4 leading-tight">
              <span className="gradient-text">查单词，用小猹</span>
            </h1>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 leading-tight">
              选中，即懂
            </h2>
          </div>

          {/* Description */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed text-balance">
            选中任何不懂的单词，立刻获得明明白白的解释。<br />
            像闰土在瓜田里一样，充满好奇心地探索世界。
          </p>

          {/* Interactive Demo */}
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 max-w-2xl mx-auto border border-orange-100">
            <div className="flex items-center justify-center mb-4">
              <MousePointer className="w-6 h-6 text-primary-500 mr-2" />
              <span className="text-gray-700 font-medium">试试选中下面的文字：</span>
            </div>
            <div
              className="text-lg text-gray-700 leading-relaxed select-text cursor-text p-4 rounded-lg bg-orange-50 border border-orange-200"
              onMouseUp={handleTextSelect}
            >
              The <span className="font-medium text-primary-600">serendipity</span> of discovery lies in unexpected moments of insight. When we encounter unfamiliar words like <span className="font-medium text-primary-600">ubiquitous</span> or <span className="font-medium text-primary-600">paradigm</span>, each becomes a gateway to deeper understanding.
            </div>

            {showExplanation && selectedText && (
              <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200 animate-fade-in">
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-sm">🌱</span>
                  </div>
                  <span className="font-medium text-primary-800">小猹解释</span>
                </div>
                <p className="text-gray-700">
                  <strong>"{selectedText}"</strong> 的意思就是...
                  {selectedText === 'serendipity' && '意外发现珍奇事物的天赋，美好的巧合。'}
                  {selectedText === 'ubiquitous' && '无处不在的，普遍存在的。'}
                  {selectedText === 'paradigm' && '范式，模式，思维方式。'}
                </p>
              </div>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <a
              href="/assets/chrome-extension.zip"
              download="chrome-extension.zip"
              className="btn-primary group inline-block"
            >
              <Download className="w-5 h-5 mr-2 group-hover:animate-bounce" />
              下载 Chrome 插件
            </a>
            <button className="btn-secondary">
              <Search className="w-5 h-5 mr-2" />
              了解更多
            </button>
          </div>

          {/* Key Features */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <MousePointer className="w-8 h-8 text-primary-500" />
              </div>
              <h3 className="text-gray-900 font-bold mb-2 text-lg">选中即触发</h3>
              <p className="text-gray-600 text-sm">无需复制粘贴，选中即懂</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-8 h-8 text-green-500" />
              </div>
              <h3 className="text-gray-900 font-bold mb-2 text-lg">解释超清晰</h3>
              <p className="text-gray-600 text-sm">大白话式的易懂解释</p>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                <span className="text-2xl">🌱</span>
              </div>
              <h3 className="text-gray-900 font-bold mb-2 text-lg">陪伴感十足</h3>
              <p className="text-gray-600 text-sm">小猹陪你探索知识世界</p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 border-2 border-primary-300 rounded-full flex justify-center">
          <div className="w-1 h-3 bg-primary-300 rounded-full mt-2 animate-pulse" />
        </div>
      </div>
    </section>
  );
};