import { Heart, Book, Users, Sparkles } from 'lucide-react';

export const Story = () => {
  return (
    <section id="story" className="py-20 cha-gradient-bg">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center px-4 py-2 bg-primary-100 border border-primary-200 rounded-full text-primary-700 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              品牌故事
            </div>
            <h2 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              为什么叫<span className="gradient-text">小猹</span>？
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              从鲁迅《故乡》到现代知识探索，这是一个关于好奇心和发现的故事
            </p>
          </div>

          {/* Main Story */}
          <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-orange-100">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mr-4">
                    <Book className="w-6 h-6 text-primary-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">文化共鸣的源头</h3>
                </div>

                <div className="space-y-4 text-gray-700 leading-relaxed">
                  <p>
                    在鲁迅的《故乡》中，<strong>"猹"</strong>是少年闰土在月光下的瓜田里探索的神秘生物。
                    这个形象承载着中国人集体记忆中的<strong>探索精神</strong>和<strong>童真好奇心</strong>。
                  </p>

                  <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                    <p className="italic text-gray-800">
                      "月亮底下，你听，啦啦的响了，猹在咬瓜了。"
                    </p>
                    <p className="text-sm text-gray-600 mt-2">—— 鲁迅《故乡》中闰土的话</p>
                  </div>

                  <p>
                    闰土代表了我们心中那个<strong>勇敢、好奇、热爱探索</strong>的自己。
                    而小猹，就是现代知识世界里陪伴我们探索的伙伴。
                  </p>
                </div>
              </div>

              <div className="text-center">
                <div className="relative">
                  <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-primary-100 to-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-6xl">🌱</span>
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-pulse">
                    <span className="text-sm">✨</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-bold text-gray-900 text-lg">查单词，用小猹</h4>
                  <p className="text-gray-600">
                    不仅是谐音梗的巧妙，更是文化记忆的唤醒
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Value Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="bg-white rounded-2xl p-6 border border-orange-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-4">
                <Heart className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">情感温度</h3>
              <p className="text-gray-600">
                小猹让冰冷的查词工具变得有温度，像闰土一样成为知识探索中的温暖伙伴
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-green-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">集体记忆</h3>
              <p className="text-gray-600">
                唤醒几代人的语文课本记忆，让品牌有深厚的文化根基和情感共鸣
              </p>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-purple-100 hover:shadow-lg transition-shadow duration-300">
              <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-4">
                <Sparkles className="w-7 h-7 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">探索精神</h3>
              <p className="text-gray-600">
                传承闰土的探索精神，让每一次查词都成为发现新知的奇妙旅程
              </p>
            </div>
          </div>

          {/* Brand Philosophy */}
          <div className="bg-gradient-to-r from-primary-50 to-red-50 rounded-3xl p-8 border border-primary-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">我们的品牌哲学</h3>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-bold text-primary-700 mb-3">从"选中"到"懂了"</h4>
                <p className="text-gray-700">
                  我们不满足于简单的信息查询。小猹的目标是让每个用户真正<strong>理解</strong>，
                  而不只是<strong>知道</strong>。从选中的那一刻开始，到真正懂了的瞬间，这就是我们的价值。
                </p>
              </div>

              <div>
                <h4 className="font-bold text-primary-700 mb-3">工具即伙伴</h4>
                <p className="text-gray-700">
                  最好的工具应该让人感觉不到工具的存在。小猹不是一个冰冷的软件，
                  而是像闰土的伙伴一样，在知识探索路上给你温暖陪伴。
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="inline-block">
                <p className="text-lg font-medium text-gray-900 mb-4">
                  选中，即懂 🌱 查单词，用小猹
                </p>
                <button className="btn-primary">
                  <Heart className="w-5 h-5 mr-2" />
                  体验小猹的陪伴
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};