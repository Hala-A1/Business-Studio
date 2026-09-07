import { ArrowLeft, Image } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/copywriter logo.png';
import './signin.css';

export default function ChooseWorkspace() {
  const navigate = useNavigate();

  return (
    <div className="workspace-screen">
      <header className="workspace-header">
        <div className="brand-mark"><strong className="brand-logo">e&</strong><span>product studio</span></div>
        <div className="workspace-header-copy">
          <h1>Choose your creative workspace.</h1>
          <p>Start with a product poster or turn your ideas into polished campaign copy.</p>
        </div>
      </header>
      <main className="workspace-content">
        <div className="workspace-picker">
          <h2>What would you like to create?</h2>
          <div className="workspace-grid">
            <button className="workspace-card" type="button" onClick={() => navigate('/studio')}>
              <span className="workspace-icon"><Image size={22} /></span>
              <span><strong>Creating a poster</strong><small>Turn one product photo into polished, on-brand catalogue visuals. Choose your format, background, logo, and generate multiple variations.</small></span>
            </button>
            <button className="workspace-card" type="button" onClick={() => navigate('/copywriter')}>
              <span className="workspace-icon workspace-logo-icon"><img src={logo} alt="rewrite& logo" /></span>
              <span><strong>rewrite&amp;</strong><small>Develop clear, engaging copy for product launches and campaigns. Start from a brief and shape the right message for every channel.</small></span>
            </button>
          </div>
          <button className="workspace-signout" type="button" onClick={() => navigate('/')}><ArrowLeft size={15} /> Back</button>
        </div>
      </main>
      <footer className="workspace-foot">© 2026 e& · Internal tool · Product Studio v1</footer>
    </div>
  );
}
