import apiClient from './apiClient';

const adminService = {
  // Dashboard
  getDashboardSummary: async () => {
    const { data } = await apiClient.get('/admin/dashboard/');
    return data;
  },

  // Program Outcomes (PO)
  getProgramOutcomes: async () => {
    const { data } = await apiClient.get('/program-outcomes/');
    return data;
  },

  createProgramOutcome: async (poData) => {
    const { data } = await apiClient.post('/program-outcomes/', poData);
    return data;
  },

  updateProgramOutcome: async (poId, poData) => {
    const { data } = await apiClient.put(`/program-outcomes/${poId}/`, poData);
    return data;
  },

  deleteProgramOutcome: async (poId) => {
    const { data } = await apiClient.delete(`/program-outcomes/${poId}/`);
    return data;
  },

  // Learning Outcomes (LO)
  getLearningOutcomes: async () => {
    const { data } = await apiClient.get('/learning-outcomes/');
    return data;
  },

  createLearningOutcome: async (loData) => {
    const { data } = await apiClient.post('/learning-outcomes/', loData);
    return data;
  },

  updateLearningOutcome: async (loId, loData) => {
    const { data } = await apiClient.put(`/learning-outcomes/${loId}/`, loData);
    return data;
  },

  deleteLearningOutcome: async (loId) => {
    const { data } = await apiClient.delete(`/learning-outcomes/${loId}/`);
    return data;
  },

  // LO to PO Connections
  getLOPOConnections: async (loId) => {
    const { data } = await apiClient.get(`/learning-outcomes/${loId}/po-connections/`);
    return data;
  },

  updateLOPOConnections: async (loId, connections) => {
    const { data } = await apiClient.put(`/learning-outcomes/${loId}/po-connections/`, {
      connections
    });
    return data;
  },

  // Enrollments
  getEnrollments: async () => {
    const { data } = await apiClient.get('/enrollments/');
    return data;
  },

  // Courses
  getCourses: async () => {
    const { data } = await apiClient.get('/admin/courses/');
    return data;
  },

  createCourse: async (courseData) => {
    const { data } = await apiClient.post('/admin/courses/', courseData);
    return data;
  },

  updateCourse: async (courseId, courseData) => {
    const { data } = await apiClient.put(`/admin/courses/${courseId}/`, courseData);
    return data;
  },

  deleteCourse: async (courseId) => {
    const { data } = await apiClient.delete(`/admin/courses/${courseId}/`);
    return data;
  },

  assignProfessorToCourse: async (courseId, professorId) => {
    const { data } = await apiClient.post(`/admin/courses/${courseId}/assign-professor/`, {
      professor_id: professorId
    });
    return data;
  },

  // Students
  getStudents: async () => {
    const { data } = await apiClient.get('/admin/students/');
    return data;
  },

  createStudent: async (studentData) => {
    const { data } = await apiClient.post('/admin/students/', studentData);
    return data;
  },

  updateStudent: async (studentId, studentData) => {
    const { data } = await apiClient.put(`/admin/students/${studentId}/`, studentData);
    return data;
  },

  deleteStudent: async (studentId) => {
    const { data } = await apiClient.delete(`/admin/students/${studentId}/`);
    return data;
  },

  assignStudentToCourse: async (studentId, courseId) => {
    const { data } = await apiClient.post(`/admin/students/${studentId}/assign-course/`, {
      course_id: courseId
    });
    return data;
  },

  // Professors
  getProfessors: async () => {
    const { data } = await apiClient.get('/admin/professors/');
    return data;
  },

  createProfessor: async (professorData) => {
    const { data } = await apiClient.post('/admin/professors/', professorData);
    return data;
  },

  updateProfessor: async (professorId, professorData) => {
    const { data } = await apiClient.put(`/admin/professors/${professorId}/`, professorData);
    return data;
  },

  deleteProfessor: async (professorId) => {
    const { data } = await apiClient.delete(`/admin/professors/${professorId}/`);
    return data;
  },

  // Approvals
  getPendingApprovals: async () => {
    const { data } = await apiClient.get('/admin/approvals/pending/');
    return data;
  },

  approveRequest: async (approvalId) => {
    const { data } = await apiClient.post(`/admin/approvals/${approvalId}/approve/`);
    return data;
  },

  rejectRequest: async (approvalId) => {
    const { data } = await apiClient.post(`/admin/approvals/${approvalId}/reject/`);
    return data;
  }
};

export default adminService;

