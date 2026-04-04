import { Routes, Route } from 'react-router-dom'
import { UserProvider } from './context/UserContext'
import LandingPage from './pages/LandingPage'
import Login from './pages/Login'
import SignUp from './pages/SignUp'
import Onboarding from './pages/Onboarding'
import Dashboard from './pages/Dashboard'
import { ToastContainer } from './components/ui/Toast'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <UserProvider>
      <Routes>
        <Route path="/"           element={<LandingPage />} />
        <Route path="/signup"     element={<SignUp />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/onboarding" element={
          <ProtectedRoute>
            <Onboarding />
          </ProtectedRoute>
        } />
        <Route path="/dashboard"  element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />
      </Routes>
      <ToastContainer />
    </UserProvider>
  )
}

export default App