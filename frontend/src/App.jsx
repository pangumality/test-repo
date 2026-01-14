import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DashboardLayout from './layouts/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import RequireRole from './components/RequireRole';
import Attendance from './pages/Attendance';
import Messages from './pages/Messages';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Classes from './pages/Classes';
import Exams from './pages/Exams';
import Finance from './pages/Finance';
import Library from './pages/Library';
import Hostel from './pages/Hostel';
import Transport from './pages/Transport';
import ELearning from './pages/ELearning';
import ELearningSubject from './pages/ELearning/Subject';
import ElearningItemForm from './pages/ELearning/ElearningItemForm';
import ExamSetup from './pages/Exams/Setup';
import Sports from './pages/Sports';
import GroupStudies from './pages/GroupStudies';
import LiveRoom from './pages/GroupStudies/LiveRoom';
import Inventory from './pages/Inventory';
import Schools from './pages/Schools';
import SchoolDetails from './pages/Schools/SchoolDetails';
import Subjects from './pages/Subjects';
import StudentExams from './pages/StudentExams';
import TakeExam from './pages/StudentExams/TakeExam';
import Newsletter from './pages/Newsletter';
import Gallery from './pages/Gallery';
import Leaves from './pages/Leaves';
import TimeTable from './pages/TimeTable';
import Certificates from './pages/Certificates';
import Profile from './pages/Profile';
import NoticeBoard from './pages/NoticeBoard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="attendance" element={<Attendance />} />
          <Route path="messages" element={<Messages />} />
          <Route path="notices" element={<NoticeBoard />} />
          <Route path="newsletters" element={<Newsletter />} />
          <Route path="gallery" element={<Gallery />} />
          <Route path="leaves" element={<Leaves />} />
          <Route path="timetable" element={<TimeTable />} />
          <Route path="certificates" element={<Certificates />} />
          <Route path="students" element={<Students />} />
          <Route path="classes" element={<Classes />} />
          <Route path="schools" element={
            <RequireRole roles={['admin']}>
              <Schools />
            </RequireRole>
          } />
          <Route path="schools/:id" element={
            <RequireRole roles={['admin']}>
              <SchoolDetails />
            </RequireRole>
          } />
          <Route path="exams" element={<Exams />} />
          
          {/* Student Exam Routes */}
          <Route path="student/exams" element={<StudentExams />} />
          <Route path="student/exams/:paperId/take" element={<TakeExam />} />

          {/* Restricted Routes for Admins only */}
          <Route path="teachers" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Teachers />
            </RequireRole>
          } />
          <Route path="finance" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Finance />
            </RequireRole>
          } />
          <Route path="library" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Library />
            </RequireRole>
          } />
          <Route path="hostel" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Hostel />
            </RequireRole>
          } />
          <Route path="transport" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Transport />
            </RequireRole>
          } />
          <Route path="sports" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Sports />
            </RequireRole>
          } />
          <Route path="inventory" element={
            <RequireRole roles={['admin', 'school_admin']}>
              <Inventory />
            </RequireRole>
          } />

          <Route path="radio" element={<Navigate to="/e-learning" replace />} />
          <Route path="e-learning" element={<ELearning />} />
          <Route path="e-learning/:subjectId" element={<ELearningSubject />} />
          <Route path="e-learning/:subjectId/:type/form" element={<ElearningItemForm />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="group-studies" element={<GroupStudies />} />
          <Route path="group-studies/:id/live" element={<LiveRoom />} />
          <Route path="exams/:examId/setup" element={<ExamSetup />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;
