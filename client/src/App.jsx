import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import Home from './pages/Home'
import LessonSelect from './pages/LessonSelect'
import LessonPlay from './pages/LessonPlay'
import MissionMode from './pages/MissionMode'
import Dashboard from './pages/Dashboard'
import Login from './pages/Login'
import Landing from './pages/Landing'
import Record from './pages/Record'

function App() {
  return (
    <Router>
      <Routes>
        {/* Landing page (no layout) */}
        <Route path="/welcome" element={<Landing />} />

        {/* App pages with sidebar layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/lessons" element={<LessonSelect />} />
          <Route path="/lessons/:lessonId" element={<LessonPlay />} />
          <Route path="/missions" element={<MissionMode />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<Login />} />
          <Route path="/record" element={<Record />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
