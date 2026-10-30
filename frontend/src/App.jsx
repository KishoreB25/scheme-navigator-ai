import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import AppShell from './components/layout/AppShell';
import AlertsPage from './pages/AlertsPage';
import ChatPage from './pages/ChatPage';
import GuidePage from './pages/GuidePage';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
const WorkspaceRoute = ({ children }) => <AppShell>{children}</AppShell>;
export default function App() { const location = useLocation(); return <Routes><Route path="/" element={<Home/>}/><Route path="/chat" element={<WorkspaceRoute><ChatPage/></WorkspaceRoute>}/><Route path="/profile" element={<WorkspaceRoute><ProfilePage/></WorkspaceRoute>}/><Route path="/alerts" element={<WorkspaceRoute><AlertsPage/></WorkspaceRoute>}/><Route path="/guide/:schemeId" element={<WorkspaceRoute><GuidePage/></WorkspaceRoute>}/><Route path="*" element={<Navigate to={location.pathname.startsWith('/guide') ? '/' : '/'} replace/>}/></Routes>; }
