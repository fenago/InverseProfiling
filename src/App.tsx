import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './lib/theme'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import ProfileDashboard from './pages/ProfileDashboard'
import ActivityDashboard from './pages/ActivityDashboard'
import SettingsPage from './pages/SettingsPage'
import BenchmarkPage from './pages/BenchmarkPage'
import StatusPage from './pages/StatusPage'
import AboutPage from './pages/AboutPage'
import OfflineIndicator from './components/OfflineIndicator'

function App() {
  return (
    <ThemeProvider>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="profile" element={<ProfileDashboard />} />
          <Route path="activity" element={<ActivityDashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="benchmarks" element={<BenchmarkPage />} />
          <Route path="status" element={<StatusPage />} />
          <Route path="about" element={<AboutPage />} />
        </Route>
      </Routes>
      <OfflineIndicator />
    </ThemeProvider>
  )
}

export default App
