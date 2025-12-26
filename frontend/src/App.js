import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GradeCalculator from './components/GradeCalculator';
import StudentLogin from './pages/student/StudentLogin';
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssessments from './pages/student/StudentAssessments';
import StudentLearningOutcomes from './pages/student/StudentLearningOutcomes';
import StudentProgramOutcomes from './pages/student/StudentProgramOutcomes';
import StudentProfile from './pages/student/StudentProfile';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProgramOutcomes from './pages/admin/ProgramOutcomes';
import LearningOutcomes from './pages/admin/LearningOutcomes';
import Courses from './pages/admin/Courses';
import Users from './pages/admin/Users';
import StudentOptions from './pages/admin/StudentOptions';
import Approvals from './pages/admin/Approvals';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/professor" element={<GradeCalculator />} />
          <Route path="/student/login" element={<StudentLogin />} />
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="assessments" element={<StudentAssessments />} />
            <Route path="learning-outcomes" element={<StudentLearningOutcomes />} />
            <Route path="program-outcomes" element={<StudentProgramOutcomes />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="program-outcomes" element={<ProgramOutcomes />} />
            <Route path="learning-outcomes" element={<LearningOutcomes />} />
            <Route path="courses" element={<Courses />} />
            <Route path="users" element={<Users />} />
            <Route path="student-options" element={<StudentOptions />} />
            <Route path="approvals" element={<Approvals />} />
          </Route>
          <Route path="*" element={<Navigate to="/student/login" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
