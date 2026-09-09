import { Routes, Route, Navigate } from 'react-router-dom';
import { RequireAuth } from './components/common';
import SiteHeader from './components/SiteHeader';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Home from './pages/student/Home';
import TrackView from './pages/student/TrackView';
import LessonView from './pages/student/LessonView';
import ModuleQuiz from './pages/student/ModuleQuiz';
import ProgressView from './pages/student/ProgressView';
import TestList from './pages/student/TestList';
import TestRunner from './pages/student/TestRunner';

import AdminContent from './pages/admin/AdminContent';
import AdminTests from './pages/admin/AdminTests';
import AdminTestEditor from './pages/admin/AdminTestEditor';
import AdminReports from './pages/admin/AdminReports';

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/catalog'} replace />;
}

export default function App() {
  return (
    <>
      <SiteHeader />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<Login key="student-login" defaultRole="student" />} />
        <Route path="/admin/login" element={<Login key="admin-login" defaultRole="admin" />} />

        {/* Student */}
        <Route path="/catalog" element={<RequireAuth role="student"><Home /></RequireAuth>} />
        <Route path="/tracks/:slug" element={<RequireAuth role="student"><TrackView /></RequireAuth>} />
        <Route path="/tracks/:slug/modules/:moduleId/quiz" element={<RequireAuth role="student"><ModuleQuiz /></RequireAuth>} />
        <Route path="/lessons/:id" element={<RequireAuth role="student"><LessonView /></RequireAuth>} />
        <Route path="/progress" element={<RequireAuth role="student"><ProgressView /></RequireAuth>} />
        <Route path="/tests" element={<RequireAuth role="student"><TestList /></RequireAuth>} />
        <Route path="/tests/:id" element={<RequireAuth role="student"><TestRunner /></RequireAuth>} />

        {/* Admin */}
        <Route path="/admin" element={<RequireAuth role="admin"><AdminContent /></RequireAuth>} />
        <Route path="/admin/tests" element={<RequireAuth role="admin"><AdminTests /></RequireAuth>} />
        <Route path="/admin/tests/:id" element={<RequireAuth role="admin"><AdminTestEditor /></RequireAuth>} />
        <Route path="/admin/reports" element={<RequireAuth role="admin"><AdminReports /></RequireAuth>} />

        <Route path="*" element={<div className="container">Not found. <a href="/">Home</a></div>} />
      </Routes>
    </>
  );
}
