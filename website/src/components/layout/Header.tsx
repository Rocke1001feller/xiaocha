import { useState, useEffect } from 'react';
import { Menu, X, Download, MousePointer } from 'lucide-react';

export const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { href: '#features', label: '核心特性' },
    { href: '#demo', label: '使用演示' },
    { href: '#story', label: '品牌故事' },
    { href: '#download', label: '下载' },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-lg border border-orange-100'
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center space-x-3 group cursor-pointer">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-red-500 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <span className="text-white font-bold text-xl">🌱</span>
            </div>
            <div>
              <span className={`text-xl font-bold ${isScrolled ? 'text-gray-900' : 'text-gray-900'}`}>
                小猹
              </span>
              <div className={`text-xs font-medium ${isScrolled ? 'text-primary-600' : 'text-primary-700'}`}>
                查单词，用小猹
              </div>
            </div>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors duration-200 hover-lift ${
                  isScrolled
                    ? 'text-gray-700 hover:text-primary-600'
                    : 'text-gray-800 hover:text-primary-600'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <a
              href="/assets/chrome-extension.zip"
              download="chrome-extension.zip"
              className={`hidden sm:flex items-center px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                isScrolled
                  ? 'border border-primary-500 text-primary-600 hover:bg-primary-50'
                  : 'border-2 border-primary-500 text-primary-600 hover:bg-primary-50'
              }`}
            >
              <Download className="w-4 h-4 mr-2" />
              下载插件
            </a>
            <button className="btn-primary text-sm px-6 py-2">
              <MousePointer className="w-4 h-4 mr-2" />
              立即体验
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`lg:hidden p-2 rounded-lg transition-colors duration-200 ${
                isScrolled ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-800 hover:bg-gray-100'
              }`}
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-orange-100 shadow-lg">
          <div className="container mx-auto px-6 py-4">
            <div className="space-y-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block py-3 px-4 text-gray-700 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors duration-200 font-medium"
                >
                  {item.label}
                </a>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="space-y-3">
                <a
                  href="/assets/chrome-extension.zip"
                  download="chrome-extension.zip"
                  className="w-full flex items-center justify-center px-4 py-3 border border-primary-500 text-primary-600 rounded-lg font-medium hover:bg-primary-50 transition-colors duration-200"
                >
                  <Download className="w-4 h-4 mr-2" />
                  下载 Chrome 插件
                </a>
                <button className="w-full btn-primary">
                  <MousePointer className="w-4 h-4 mr-2" />
                  立即体验
                </button>
              </div>
            </div>

            {/* Brand tagline */}
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <div className="inline-flex items-center px-3 py-1 bg-primary-100 rounded-full">
                <span className="text-sm font-medium text-primary-700">
                  🌱 查单词，用小猹
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};