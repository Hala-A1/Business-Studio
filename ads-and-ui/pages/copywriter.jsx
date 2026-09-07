import { ArrowLeft, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './signin.css';

export default function Copywriter() {
  const navigate = useNavigate();
  return (
    <div className="signin-screen">
      <div className="signin-visual">
        <div className="brand-mark"><strong className="brand-logo">e&</strong><span>product studio</span></div>
        <div className="signin-copy"><h1>Turn product details into campaign-ready copy.</h1><p>The copywriter workspace is ready for your next brief.</p></div>
        <div className="signin-foot">© 2026 e& · Internal tool · Product Studio v1</div>
      </div>
      <div className="signin-form-wrap">
        <div className="signin-form workspace-picker">
          <span className="workspace-icon"><FileText size={24} /></span>
          <p className="kicker">COPYWRITER</p>
          <h2>Copywriter workspace</h2>
          <p className="workspace-message">Add your product brief to start creating campaign copy.</p>
          <button className="btn-primary" type="button">Start a brief</button>
          <button className="workspace-signout" type="button" onClick={() => navigate('/choose')}><ArrowLeft size={15} /> Back to workspaces</button>
        </div>
      </div>
    </div>
  );
}
