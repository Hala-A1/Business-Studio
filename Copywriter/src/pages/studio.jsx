import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, ImagePlus, Maximize2, Sparkles, Upload, X } from 'lucide-react';
import etisalatLogo from '../assets/etisalat-wordmark.webp';
import './studio.css';

const backgrounds = [
  ['transparent', 'Transparent'],
  ['white', 'Studio white'],
  ['black', 'Black'],
  ['generate', 'AI generated'],
];
const stepIds = ['upload', 'format', 'quantity', 'background', 'details'];

export default function Studio() {
  const navigate = useNavigate();
  const fileInput = useRef(null);
  const [image, setImage] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [size, setSize] = useState('1024 x 1024');
  const [customWidth, setCustomWidth] = useState('');
  const [customHeight, setCustomHeight] = useState('');
  const [samples, setSamples] = useState(3);
  const [background, setBackground] = useState('white');
  const [description, setDescription] = useState('');
  const [sceneDescription, setSceneDescription] = useState('');
  const [descriptionOpen, setDescriptionOpen] = useState(false);
  const [quality, setQuality] = useState('medium');
  const [includeLogo, setIncludeLogo] = useState(true);
  const [logoVariant, setLogoVariant] = useState('e&');
  const [quantityHidden, setQuantityHidden] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const generatedSection = useRef(null);
  const customSize = customWidth && customHeight ? `${customWidth} x ${customHeight}` : '';
  const selectedSize = size === 'customized' ? customSize : size;
  const canGenerate = Boolean(image && selectedSize);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const sections = stepIds
      .map((id) => document.getElementById(`studio-${id}`))
      .filter(Boolean);
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) {
          setActiveStep(Number(visible[0].target.dataset.step));
        }
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (generatedImages.length > 0) {
      generatedSection.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [generatedImages]);

  function goToStep(index) {
    document.getElementById(`studio-${stepIds[index]}`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    });
  }

  function addFile(file) {
    if (!file || !file.type.startsWith('image/')) return;
    setImage({ file, url: URL.createObjectURL(file) });
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    addFile(event.dataTransfer.files[0]);
  }

  function removeImage() {
    if (image) URL.revokeObjectURL(image.url);
    setImage(null);
  }

  async function generateVisuals() {
    setGenerating(true);
    setError('');
    try {
      const imageData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('Could not read the product image'));
        reader.readAsDataURL(image.file);
      });
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `Create ${background} catalogue product visuals. ${includeLogo ? `Include the ${logoVariant} logo consistently in the poster design.` : 'Do not include any e& logo.'} Product details: ${description}. Scene styling: ${sceneDescription}`.trim(),
          image: imageData,
          size: selectedSize,
          samples,
          quality,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Image generation failed');
      setGeneratedPrompt(`${description || 'No product description provided.'}${sceneDescription ? ` Scene styling: ${sceneDescription}` : ''}`);
      setGeneratedImages(result.images.map((base64) => `data:image/png;base64,${base64}`));
    } catch (generationError) {
      setError(generationError.message);
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="studio-screen">
      <aside className="studio-sidebar">
        <div className="side-brand">
          <strong className="brand-logo">e&</strong>
          <span>product studio</span>
        </div>
        <ol className="steps">
          {['Upload product', 'Choose format', 'Set quantity', 'Pick background', 'Product details'].map((label, index) => (
            <li className={`step-item ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'done' : ''}`} key={label} onClick={() => goToStep(index)} onKeyDown={(event) => event.key === 'Enter' && goToStep(index)} role="button" tabIndex={0} aria-current={index === activeStep ? 'step' : undefined}>
              <span className="step-num">{index + 1}</span>
              <span className="step-label">{label}</span>
            </li>
          ))}
        </ol>
        <div className="side-foot">
          <div className="user-chip"><span className="avatar">MK</span><span className="u-email">mariam.k@eand.ae</span></div>
          <button className="signout-btn" type="button" onClick={() => navigate('/')}>Sign out</button>
        </div>
      </aside>

      <main className="studio-main">
        <header className="studio-header">
          <h1>Create product visuals</h1>
          <p>Configure your catalogue shoot and generate on-brand variations.</p>
        </header>

        {generatedImages.length > 0 && <section className="panel generated-panel" ref={generatedSection}><div className="panel-head"><span className="p-num">06</span><h3>Generated visuals</h3></div><div className="generated-results">{generatedImages.map((src, index) => <div className="generated-card" key={src}><button className="generated-image" type="button" onClick={() => setSelectedImage(src)}><img src={src} alt={`Generated variation ${index + 1}`} /></button><div className="generated-details"><span className="generated-label">Description used</span><p>{generatedPrompt}</p><div className="generated-actions"><button type="button" onClick={() => setSelectedImage(src)}><Maximize2 size={14} /> Open</button><a href={src} download={`product-visual-${index + 1}.png`}><Download size={14} /> Download</a></div></div></div>)}</div></section>}
        {error && <p role="alert" className="stepper-note">{error}</p>}
        <section className="panel" id="studio-upload" data-step="0">
          <div className="panel-head"><span className="p-num">01</span><h3>Upload product image</h3></div>
          <p className="panel-sub">Use a clear, front-facing image with the product fully in frame.</p>
          <input ref={fileInput} type="file" accept="image/*" hidden onChange={(event) => addFile(event.target.files[0])} />
          {!image ? (
            <div className={`dropzone ${dragging ? 'drag' : ''}`} onClick={() => fileInput.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
              <Upload size={27} />
              <div className="dz-title">Drop an image here or browse</div>
              <div className="dz-sub">PNG, JPG or WEBP · Max 10 MB</div>
            </div>
          ) : (
            <div className="preview-row"><div className="preview-thumb"><img src={image.url} alt="Product preview" /><button className="remove" type="button" onClick={removeImage} aria-label="Remove image"><X size={13} /></button></div></div>
          )}
        </section>

        <section className="panel" id="studio-format" data-step="1">
          <div className="panel-head"><span className="p-num">02</span><h3>Choose output format</h3></div>
          <div className="select-wrap"><select value={size} onChange={(event) => setSize(event.target.value)}><option value="1024 x 1024">1024 x 1024 · Square</option><option value="1536 x 1024">1536 x 1024 · Landscape</option><option value="1024 x 1536">1024 x 1536 · Portrait</option><option value="customized">{customSize ? `Customized · ${customSize}` : 'Custom size'}</option></select></div>
          {size === 'customized' && <div className="custom-size-row"><span>Custom size</span><input aria-label="Custom width" type="number" min="256" value={customWidth} onChange={(event) => setCustomWidth(event.target.value)} placeholder="Width" /><span>×</span><input aria-label="Custom height" type="number" min="256" value={customHeight} onChange={(event) => setCustomHeight(event.target.value)} placeholder="Height" /><span>px</span></div>}
          <div className="format-hint">{customSize ? 'Customized format selected' : 'Choose a preset or enter your own dimensions.'}</div>
        </section>

        <section className="panel" id="studio-quantity" data-step="2">
          <div className="panel-head"><span className="p-num">03</span><h3>Number of samples</h3><button className="hide-options-button" type="button" onClick={() => setQuantityHidden(!quantityHidden)}>{quantityHidden ? 'Show quantity' : 'Hide quantity'}</button></div>
          {!quantityHidden && <><div className="stepper"><button type="button" onClick={() => setSamples(Math.max(1, samples - 1))}>−</button><span className="count">{samples}</span><button type="button" onClick={() => setSamples(Math.min(3, samples + 1))}>+</button></div>
          <div className="stepper-note">Generate up to 3 variations at once.</div></>}
        </section>

        <section className="panel" id="studio-background" data-step="3">
          <div className="panel-head"><span className="p-num">04</span><h3>Pick a background</h3></div>
          <div className="bg-grid">{backgrounds.map(([value, label]) => <button type="button" className={`bg-option ${background === value ? 'selected' : ''}`} key={value} onClick={() => setBackground(value)}><div className={`bg-preview ${value}`}><ImagePlus size={18} /></div><div className="opt-label">{label}</div></button>)}</div>
          <div className="bg-extra"><textarea value={sceneDescription} onChange={(event) => setSceneDescription(event.target.value)} placeholder="Add optional scene or styling instructions..." /></div>
        </section>

        <section className="panel" id="studio-details" data-step="4">
          <div className="panel-head"><span className="p-num">05</span><h3>Product details</h3></div>
          <button className="description-button" type="button" onClick={() => setDescriptionOpen(!descriptionOpen)}>{descriptionOpen ? 'Hide description' : 'Add product description'}</button>
          {descriptionOpen && <textarea className="product-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Describe the product, materials, colors, features, and styling details..." />}
          <div className="quality-row"><label htmlFor="quality">Image quality</label><div className="select-wrap"><select id="quality" value={quality} onChange={(event) => setQuality(event.target.value)}><option value="low">Draft · Faster</option><option value="medium">Standard</option><option value="high">High · More detail</option></select></div></div>
          <label className="logo-toggle"><input type="checkbox" checked={includeLogo} onChange={(event) => setIncludeLogo(event.target.checked)} /> Add e& logo to poster</label>
          {includeLogo && <div className="logo-options" role="radiogroup" aria-label="Choose poster logo">
            <label className={`logo-option ${logoVariant === 'e&' ? 'selected' : ''}`}><input type="radio" name="logo" value="e&" checked={logoVariant === 'e&'} onChange={() => setLogoVariant('e&')} /><strong className="logo-option-mark">e&</strong><span>e& mark<br /><small>No writing</small></span></label>
            <label className={`logo-option ${logoVariant === 'Etisalat and' ? 'selected' : ''}`}><input type="radio" name="logo" value="Etisalat and" checked={logoVariant === 'Etisalat and'} onChange={() => setLogoVariant('Etisalat and')} /><img src={etisalatLogo} alt="Etisalat and logo with writing" /><span>Etisalat and<br /><small>With writing</small></span></label>
          </div>}
        </section>
      </main>

      <div className="action-bar"><span className="action-summary">{image ? `${samples} samples · ${selectedSize || 'Enter a custom size'}` : 'Upload an image to begin'}</span><button className="btn-generate" type="button" disabled={!canGenerate || generating} onClick={generateVisuals}><Sparkles size={17} /> {generating ? 'Generating…' : 'Generate visuals'}</button></div>
      {selectedImage && <div className="image-modal" role="dialog" aria-modal="true" aria-label="Generated image preview" onClick={() => setSelectedImage(null)}><div className="image-modal-content" onClick={(event) => event.stopPropagation()}><button className="modal-close" type="button" onClick={() => setSelectedImage(null)} aria-label="Close preview"><X size={20} /></button><img src={selectedImage} alt="Large generated product visual" /><a className="modal-download" href={selectedImage} download="product-visual.png"><Download size={16} /> Download image</a></div></div>}
    </div>
  );
}
