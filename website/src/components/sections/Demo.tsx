import { useState } from 'react';

export const Demo = () => {
  const [selectedText, setSelectedText] = useState('');
  const [showResult, setShowResult] = useState(false);

  const sampleTexts = [
    { text: 'serendipity', translation: '意外发现美好事物的能力' },
    { text: 'butterfly effect', translation: '蝴蝶效应' },
    { text: 'artificial intelligence', translation: '人工智能' }
  ];

  const handleTextSelect = (text: string) => {
    setSelectedText(text);
    setShowResult(true);
  };

  const mockResult = {
    phonetic: selectedText.includes(' ') ? '/ˌɑːrtɪfɪʃl ɪnˈtelɪdʒəns/' : '/ˌserənˈdɪpɪti/',
    definitions: [
      {
        pos: 'n.',
        meaning: selectedText.includes(' ') ? '人造的智能' : '意外发现珍奇事物的天赋',
        example: selectedText.includes(' ')
          ? 'Artificial intelligence is transforming many industries.'
          : 'The discovery of penicillin was a happy serendipity.'
      }
    ],
    translation: sampleTexts.find(t => t.text === selectedText)?.translation || '',
    contextual_analysis: selectedText.includes(' ')
      ? 'AI 指由计算机系统展现的智能，能够执行通常需要人类智慧的任务。'
      : 'Serendipity 指意外发现有价值或令人愉悦事物的天赋，这种发现并非通过寻找而来。'
  };

  return (
    <section id="demo" className="py-20 bg-slate-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            体验 <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">选中，即懂</span>
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            点击下方任意文字，体验小猹的即时翻译和深度解析功能
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Demo Area */}
          <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-slate-400 text-sm">小猹插件演示</span>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-6 mb-6">
              <p className="text-slate-300 leading-relaxed mb-4">
                The concept of <span className="text-blue-400 cursor-pointer hover:bg-blue-400/20 px-1 rounded transition-colors" onClick={() => handleTextSelect('serendipity')}>serendipity</span> has fascinated researchers for decades.
                When developing <span className="text-blue-400 cursor-pointer hover:bg-blue-400/20 px-1 rounded transition-colors" onClick={() => handleTextSelect('artificial intelligence')}>artificial intelligence</span> systems,
                engineers often encounter unexpected breakthroughs. This phenomenon relates to the <span className="text-blue-400 cursor-pointer hover:bg-blue-400/20 px-1 rounded transition-colors" onClick={() => handleTextSelect('butterfly effect')}>butterfly effect</span> in chaos theory,
                where small changes can lead to significant outcomes.
              </p>

              <div className="flex flex-wrap gap-2">
                {sampleTexts.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleTextSelect(item.text)}
                    className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 hover:bg-blue-500/20 transition-colors duration-200 text-sm"
                  >
                    选择 "{item.text}"
                  </button>
                ))}
              </div>
            </div>

            {/* Result Display */}
            {showResult && selectedText && (
              <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">解析结果</h3>
                  <button
                    onClick={() => setShowResult(false)}
                    className="text-slate-400 hover:text-white transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <span className="text-2xl font-bold text-blue-400">{selectedText}</span>
                    <span className="text-lg text-slate-300 ml-3">{mockResult.phonetic}</span>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">翻译</h4>
                    <p className="text-lg text-white">{mockResult.translation}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">词义解析</h4>
                    <div className="bg-slate-800/50 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <span className="text-blue-400 font-medium">{mockResult.definitions[0].pos}</span>
                        <div>
                          <p className="text-white">{mockResult.definitions[0].meaning}</p>
                          <p className="text-slate-400 text-sm mt-2 italic">
                            "{mockResult.definitions[0].example}"
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-slate-400 mb-2">上下文分析</h4>
                    <p className="text-slate-300">{mockResult.contextual_analysis}</p>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                      </svg>
                      收藏
                    </button>
                    <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors duration-200 text-sm font-medium">
                      <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
                      </svg>
                      分享
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="text-center">
            <p className="text-slate-400 mb-4">
              💡 这就是小猹的完整体验：选中任何文字，立即获得深度解析
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="/assets/chrome-extension.zip"
                download="chrome-extension.zip"
                className="inline-block px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 font-medium text-center"
              >
                立即下载 Chrome 插件
              </a>
              <button className="px-8 py-3 border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors duration-200 font-medium">
                了解更多功能
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};