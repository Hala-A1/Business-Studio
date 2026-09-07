import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './signin.css';

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('mariam.k@eand.ae');
  const [password, setPassword] = useState('');
  const [keepSignedIn, setKeepSignedIn] = useState(true);

  function handleSignIn(e) {
    e.preventDefault();
    // TODO: wire to real auth endpoint. For now, just navigate.
    navigate('/choose');
  }

  return (
    <div className="signin-screen">
      <div className="signin-visual">
        <div className="brand-mark">
          <strong className="brand-logo">e&</strong>
          <span>product studio</span>
        </div>

        <div className="signin-copy">
          <h1>Turn one product photo into a full catalogue shoot.</h1>
          <p>
            Upload a single image, pick a size and background, and generate
            on-brand product visuals in minutes.
          </p>
        </div>

        <div className="signin-foot">© 2026 e& · Internal tool · Product Studio v1</div>
      </div>

      <div className="signin-form-wrap">
        <form className="signin-form" onSubmit={handleSignIn}>
          <p className="kicker">WELCOME</p>
          <h2>Sign in to Product Studio</h2>

          <div className="field">
            <label htmlFor="email">Work email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className="form-row-between">
            <label className="checkbox-row">
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
              />
              Keep me signed in
            </label>
            <a href="#" className="link-muted">Forgot password?</a>
          </div>

          <button className="btn-primary" type="submit">Sign in</button>

          <div className="divider-row">or continue with</div>
          <div className="sso-row">
            <button type="button" className="btn-sso" onClick={() => navigate('/choose')}>
              Google Workspace
            </button>
            <button type="button" className="btn-sso" onClick={() => navigate('/choose')}>
              Microsoft SSO
            </button>
          </div>

          <p className="signup-note">Need access? <a href="#">Request an invite</a></p>
        </form>
      </div>
    </div>
  );
}
