import { ArrowLeft, Check, Copy, FileUp, RefreshCw, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import logo from '../assets/copywriter logo.png'
import './signin.css'

const tasks = [
  ['write', 'Write', 'Generate new customer-facing copy'],
  ['improve', 'Improve', 'Rewrite existing copy using e& CX rules'],
  ['review', 'Review', 'Analyse existing copy, score it, and explain problems'],
  ['translate', 'Translate', 'Translate copy while preserving e& terminology'],
]

const channels = ['Email', 'SMS', 'Website', 'App / Push Notification', 'In-app message', 'Other']
const audiences = ['Emirati', 'Youth', 'White Collar', 'Blue Collar', 'Single Professionals', 'Business', 'Unknown']

function BrandEmblem() {
  return (
    <svg viewBox="0 0 120 120" className="copywriter-brand-mark" aria-label="Rewrite and e& logo">
      <defs>
        <linearGradient id="copy-brand-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#ff4a43" />
          <stop offset="100%" stopColor="#d40a00" />
        </linearGradient>
      </defs>

      <rect x="10" y="12" width="100" height="96" rx="22" fill="#f5f5f7" />
      <path d="M36 30h30l18 18v41c0 8.8-7.2 16-16 16H36c-8.8 0-16-7.2-16-16V46c0-8.8 7.2-16 16-16Z" fill="url(#copy-brand-gradient)" />
      <path d="M66 30v18h18" fill="none" stroke="#fff" strokeWidth="6" strokeLinejoin="round" />
      <path d="M40 53h26M40 66h26M40 79h18" stroke="#fff" strokeWidth="6" strokeLinecap="round" />

      <g transform="translate(62 36)">
        <rect x="0" y="0" width="34" height="34" rx="10" fill="#171933" opacity="0.12"/>
        <text x="17" y="24" textAnchor="middle" fontSize="22" fontWeight="800" fill="#171933" fontFamily="Arial, sans-serif">&amp;</text>
      </g>

      <path d="M72 82c7.4 0 13.4 6 13.4 13.4v1.6c0 7.4-6 13.4-13.4 13.4H58V82h14Z" fill="#fff" opacity="0.7" />
    </svg>
  )
}

export default function Copywriter() {
  const navigate = useNavigate()
  const [task, setTask] = useState('improve')
  const [feedback, setFeedback] = useState('')
  const [result, setResult] = useState('')
  const [firstResult, setFirstResult] = useState('')
  const [analysis, setAnalysis] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [rewriting, setRewriting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState('')
  const [copied, setCopied] = useState(false)
  const [channel, setChannel] = useState('Other')
  const [audience, setAudience] = useState('Unknown')
  const [detectingContext, setDetectingContext] = useState(false)
  const [contextEdited, setContextEdited] = useState(false)
  const [contextReady, setContextReady] = useState(false)
  const currentTask = tasks.find(([value]) => value === task) || tasks[0]
  const contextDetected = contextReady && !contextEdited

  async function detectContext() {
    if (!feedback.trim()) return false
    setDetectingContext(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/detect-context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not detect the channel and audience.')
      setChannel(data.channel)
      setAudience(data.audience)
      setContextReady(true)
      setContextEdited(false)
      return { channel: data.channel, audience: data.audience }
    } catch (contextError) {
      setError(contextError.message || 'Could not detect the channel and audience.')
      return null
    } finally {
      setDetectingContext(false)
    }
  }

  useEffect(() => {
    if (contextEdited || feedback.trim().length < 5) {
      if (!feedback.trim()) setContextReady(false)
      return undefined
    }

    setContextReady(false)
    const timeout = window.setTimeout(async () => {
      setDetectingContext(true)
      setError('')
      try {
        const response = await fetch('http://127.0.0.1:8000/detect-context', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ feedback }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.detail || 'Could not detect the channel and audience.')
        setChannel(data.channel)
        setAudience(data.audience)
        setContextReady(true)
      } catch (contextError) {
        setError(contextError.message || 'Could not detect the channel and audience.')
      } finally {
        setDetectingContext(false)
      }
    }, 700)

    return () => window.clearTimeout(timeout)
  }, [feedback, contextEdited])

  async function analyzeGenerated(generated, original) {
    setAnalyzing(true)
    try {
      const response = await fetch('http://127.0.0.1:8000/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated, original }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not analyze the generated copy.')
      setAnalysis(data)
    } catch (analysisError) {
      setError(analysisError.message || 'Could not analyze the generated copy.')
    } finally {
      setAnalyzing(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setResult('')
    setAnalysis(null)

    try {
      const detectedContext = contextEdited || contextReady ? { channel, audience } : await detectContext()
      if (!detectedContext) return
      const response = await fetch('http://127.0.0.1:8000/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ feedback, task, channel: detectedContext.channel, audience: detectedContext.audience }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not create copy.')
      setResult(data.enhanced)
      setFirstResult(data.enhanced)
      await analyzeGenerated(data.enhanced, feedback)
    } catch (requestError) {
      setError(requestError.message || 'Could not connect to the Copywriter API.')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return

    setUploading(true)
    setError('')
    setUploadedFile('')
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('http://127.0.0.1:8000/extract-upload', {
        method: 'POST',
        body: formData,
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not read this file.')
      setFeedback(data.text)
      setUploadedFile(data.filename)
    } catch (uploadError) {
      setError(uploadError.message || 'Could not read this file.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleWeakRewrite() {
    if (!result || !analysis) return
    setRewriting(true)
    setError('')

    try {
      const response = await fetch('http://127.0.0.1:8000/rewrite-weak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generated: result, findings: analysis.findings || [] }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.detail || 'Could not rewrite the weak phrases.')
      setResult(data.rewritten)
      setAnalysis(null)
      await analyzeGenerated(data.rewritten, feedback)
    } catch (rewriteError) {
      setError(rewriteError.message || 'Could not rewrite the weak phrases.')
    } finally {
      setRewriting(false)
    }
  }

  async function handleUseFirstResult() {
    if (!firstResult) return
    setResult(firstResult)
    setAnalysis(null)
    await analyzeGenerated(firstResult, feedback)
  }

  async function handleCopy() {
    if (!result) return
    await navigator.clipboard.writeText(result)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  function renderHighlightedCopy() {
    if (!result) return 'Your rewritten version will appear here.'
    const phrases = (analysis?.highlighted_phrases || []).filter(Boolean)
    if (!phrases.length) return result

    const phrasePattern = phrases
      .sort((first, second) => second.length - first.length)
      .map((phrase) => phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('|')
    const parts = result.split(new RegExp(`(${phrasePattern})`, 'gi'))
    return parts.map((part, index) => {
      const isHighlighted = phrases.some((phrase) => phrase.toLowerCase() === part.toLowerCase())
      return isHighlighted ? <mark key={`${part}-${index}`}>{part}</mark> : part
    })
  }

  return (
    <div className="copywriter-page">
      <div className="copywriter-shell">
        <div className="copywriter-banner">
          <div className="copywriter-brand-stack">
            <div className="copywriter-brand-wrap">
              <img src={logo} alt="Rewrite& logo" className="copywriter-brand-logo" />
              <div className="copywriter-brand-copy">
                <span className="copywriter-brand-name">rewrit<span className="brand-red">e&amp;</span></span>
                <small>Where AI meets the e&amp; voice.</small>
              </div>
            </div>
            <p className="copywriter-banner-copy">An AI-powered e&amp; assistant that helps create, improve, review, and translate customer communications while keeping every message clear, consistent, and aligned with e&amp; writing guidelines.</p>
          </div>
        </div>

        <header className="copywriter-header">
          <div className="field compact-field">
            <label htmlFor="copywriter-task">Task</label>
            <select id="copywriter-task" value={task} onChange={(event) => setTask(event.target.value)}>
              {tasks.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
            <p className="task-description">{currentTask[2]}</p>
          </div>
        </header>

        <div className="copywriter-context-bar">
          <div className="context-bar-heading">
            <strong>{detectingContext ? 'Detecting...' : contextReady ? 'Context details (optional)' : 'Choose the context'}</strong>
          </div>
          <div className="context-field">
            <label htmlFor="copywriter-channel">{contextDetected ? 'Channel detected' : 'Channel'}</label>
            <select
              id="copywriter-channel"
              value={channel}
              onChange={(event) => {
                setChannel(event.target.value)
                setContextEdited(true)
                setContextReady(true)
              }}
            >
              {channels.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </div>
          <div className="context-field">
            <label htmlFor="copywriter-audience">{contextDetected ? 'Target audience detected' : 'Target audience'}</label>
            <select
              id="copywriter-audience"
              value={audience}
              onChange={(event) => {
                setAudience(event.target.value)
                setContextEdited(true)
                setContextReady(true)
              }}
            >
              {audiences.map((option) => <option value={option} key={option}>{option}</option>)}
            </select>
          </div>
        </div>

        {error && <p className="copywriter-error" role="alert">{error}</p>}

        <div className="copywriter-grid">
          <section className="copywriter-panel input-panel">
            <div className="copywriter-panel-head">
              <h3>Your text</h3>
              <label className="copywriter-upload-button" htmlFor="copywriter-upload">
                <FileUp size={15} /> {uploading ? 'Reading...' : 'Upload'}
                <input
                  id="copywriter-upload"
                  type="file"
                  accept="image/*,.pdf,.docx,.txt,.md,.csv,.json"
                  onChange={handleUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploadedFile && <p className="copywriter-upload-status">Text loaded from {uploadedFile}</p>}
            <textarea
              id="copywriter-text"
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={task === 'write' ? 'Channel: SMS\nAudience: Youth\nKey details: ...\nCTA: ...' : 'Paste your copy here...'}
              rows="12"
            />

            <button className="btn-primary copywriter-action" type="button" onClick={handleSubmit} disabled={loading || !feedback.trim()}>
              <Sparkles size={16} /> {loading ? 'Generating…' : 'Generate copy'}
            </button>
          </section>

          <section className="copywriter-panel output-panel">
            <div className="copywriter-panel-head">
              <h3>Generated text</h3>
              {result && (
                <button className="copywriter-copy-button" type="button" onClick={handleCopy} title="Copy generated text" aria-label="Copy generated text">
                  {copied ? <Check size={15} /> : <Copy size={15} />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>
            <div className="copywriter-output" aria-live="polite">
              {analyzing ? 'Checking the copy against the e& guidelines...' : renderHighlightedCopy()}
            </div>
            {analysis && !analyzing && (
              <div className="copywriter-analysis">
                <div className="analysis-score-row">
                  <div>
                    <span className="analysis-label">Guideline strength</span>
                    <strong>{analysis.score}%</strong>
                  </div>
                  <span className={`analysis-rating score-${analysis.score >= 85 ? 'strong' : analysis.score >= 70 ? 'mostly' : 'weak'}`}>
                    {analysis.rating}
                  </span>
                </div>
                <p className="analysis-summary">{analysis.summary}</p>
                {analysis.manual_suggestion && (
                  <p className="analysis-suggestion"><strong>Suggestion:</strong> {analysis.manual_suggestion}</p>
                )}
                {analysis.findings?.length > 0 && (
                  <div className="copywriter-analysis-actions">
                    <button className="copywriter-rewrite-button" type="button" onClick={handleWeakRewrite} disabled={rewriting}>
                      <RefreshCw size={15} /> {rewriting ? 'Rewriting weak phrases...' : 'Rewrite weak phrases'}
                    </button>
                    {firstResult && result !== firstResult && (
                      <div className="first-result-option">
                        <span>First generated version</span>
                        <p>{firstResult}</p>
                        <button type="button" onClick={handleUseFirstResult} disabled={analyzing}>
                          Use this version
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        <button className="workspace-signout" type="button" onClick={() => navigate('/choose')}>
          <ArrowLeft size={15} /> Back
        </button>
      </div>
    </div>
  )
}
