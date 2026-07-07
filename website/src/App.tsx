import { Header } from './components/layout/Header';
import { Hero } from './components/sections/Hero';
import { Features } from './components/sections/Features';
import { Demo } from './components/sections/Demo';
import { Story } from './components/sections/Story';
import { Download } from './components/sections/Download';
import { Footer } from './components/layout/Footer';

function App() {
  return (
    <div className="min-h-screen cha-gradient-bg">
      <Header />
      <main>
        <Hero />
        <Features />
        <Demo />
        <Story />
        <Download />
      </main>
      <Footer />
    </div>
  );
}

export default App;
