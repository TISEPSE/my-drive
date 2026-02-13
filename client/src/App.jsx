import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import MyDrive from './pages/MyDrive'
import SharedWithMe from './pages/SharedWithMe'
import Recent from './pages/Recent'
import Starred from './pages/Starred'
import Trash from './pages/Trash'
import History from './pages/History'
import Settings from './pages/Settings'
import FileExplorerList from './pages/FileExplorerList'
import FileExplorerDetail from './pages/FileExplorerDetail'
import Gallery from './pages/Gallery'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="drive" element={<MyDrive />} />
        <Route path="drive/folder/:folderId" element={<FileExplorerList />} />
        <Route path="drive/folder/:folderId/detail" element={<FileExplorerDetail />} />
        <Route path="shared" element={<SharedWithMe />} />
        <Route path="recent" element={<Recent />} />
        <Route path="starred" element={<Starred />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="trash" element={<Trash />} />
        <Route path="history" element={<History />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}

export default App
