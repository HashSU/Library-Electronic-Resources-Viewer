import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import ResourceDetailPage from './pages/ResourceDetailPage'
import NotFoundPage from './pages/NotFoundPage'
import LoginPage from './pages/LoginPage'
import AdminPage from './pages/AdminPage'
import AdminUploadPage from './pages/AdminUploadPage'
import AdminResourcesPage from './pages/AdminResourcesPage'
import AdminCategoriesPage from './pages/AdminCategoriesPage'
import AdminUsersPage from './pages/AdminUsersPage'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <div className="app-wrapper">
      <Navbar />

      <main className="main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/browse" element={<BrowsePage />} />
          <Route path="/resources/:id" element={<ResourceDetailPage />} />
          <Route path="/admin/login" element={<LoginPage />} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/admin/upload" element={<ProtectedRoute><AdminUploadPage /></ProtectedRoute>} />
          <Route path="/admin/resources" element={<ProtectedRoute><AdminResourcesPage /></ProtectedRoute>} />
          <Route path="/admin/categories" element={<ProtectedRoute><AdminCategoriesPage /></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute><AdminUsersPage /></ProtectedRoute>} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  )
}

export default App