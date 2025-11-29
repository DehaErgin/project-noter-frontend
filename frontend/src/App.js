import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import GradeCalculator from './components/GradeCalculator';
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import StudentAssessments from './pages/student/StudentAssessments';
import StudentLearningOutcomes from './pages/student/StudentLearningOutcomes';
import StudentProgramOutcomes from './pages/student/StudentProgramOutcomes';
import StudentProfile from './pages/student/StudentProfile';

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/professor" element={<GradeCalculator />} />
          <Route path="/student" element={<StudentLayout />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<StudentDashboard />} />
            <Route path="assessments" element={<StudentAssessments />} />
            <Route path="learning-outcomes" element={<StudentLearningOutcomes />} />
            <Route path="program-outcomes" element={<StudentProgramOutcomes />} />
            <Route path="profile" element={<StudentProfile />} />
          </Route>
          <Route path="*" element={<Navigate to="/student/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
