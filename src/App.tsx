import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import ChatPage from './pages/ChatPage'
import ProfileDashboard from './pages/ProfileDashboard'
import ActivityDashboard from './pages/ActivityDashboard'
import SettingsPage from './pages/SettingsPage'
import BenchmarkPage from './pages/BenchmarkPage'
import OfflineIndicator from './components/OfflineIndicator'

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<ChatPage />} />
          <Route path="profile" element={<ProfileDashboard />} />
          <Route path="activity" element={<ActivityDashboard />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="benchmarks" element={<BenchmarkPage />} />
        </Route>
      </Routes>
      <OfflineIndicator />
    </>
  )
}

export default App
