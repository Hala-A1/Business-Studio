import { BrowserRouter, Routes, Route } from 'react-router-dom'
import SignIn from './pages/signin.jsx'
import Studio from './pages/studio.jsx'
import ChooseWorkspace from './pages/choose-workspace.jsx'
import Copywriter from './pages/copywriter.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SignIn />} />
        <Route path="/choose" element={<ChooseWorkspace />} />
        <Route path="/studio" element={<Studio />} />
        <Route path="/copywriter" element={<Copywriter />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App