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
  getLearningOutcomes: async (courseId = null) => {
    const url = courseId 
      ? `/courses/${courseId}/learning-outcomes/`
      : '/learning-outcomes/';
    const { data } = await apiClient.get(url);
    return Array.isArray(data) ? data : (data?.learning_outcomes || data || []);
  },

  createLearningOutcome: async (loData, courseId = null) => {
    const url = courseId 
      ? `/courses/${courseId}/learning-outcomes/`
      : '/learning-outcomes/';
    const { data } = await apiClient.post(url, loData);
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

  // Get students enrolled in a course
  getCourseEnrollments: async (courseId) => {
    try {
      // Try course-specific endpoint first
      const { data } = await apiClient.get(`/admin/courses/${courseId}/enrollments/`);
      return data;
    } catch (error) {
      // Fallback: get all enrollments and filter by course
      try {
        const allEnrollments = await apiClient.get('/enrollments/');
        const enrollments = Array.isArray(allEnrollments.data) 
          ? allEnrollments.data 
          : (allEnrollments.data?.enrollments || []);
        return enrollments.filter(e => 
          e.course_id?.toString() === courseId.toString() || 
          e.course?.id?.toString() === courseId.toString()
        );
      } catch (fallbackError) {
        console.error('Error fetching course enrollments:', fallbackError);
        return [];
      }
    }
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
    console.log('[DEBUG] assignStudentToCourse called:', {
      studentId,
      courseId,
      url: `/admin/students/${studentId}/assign-course/`,
      body: { course_id: courseId }
    });
    
    try {
      const response = await apiClient.post(`/admin/students/${studentId}/assign-course/`, {
        course_id: courseId
      });
      
      console.log('[DEBUG] assignStudentToCourse response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data,
        headers: response.headers
      });
      
      // Check if response indicates success
      if (response.status >= 200 && response.status < 300) {
        console.log('[DEBUG] ✅ Course assignment successful on backend');
        // Check if response contains enrollment data
        if (response.data) {
          console.log('[DEBUG] Response contains data:', response.data);
          if (response.data.enrollment || response.data.id) {
            console.log('[DEBUG] ✅ Enrollment object found in response');
          } else {
            console.warn('[DEBUG] ⚠️ No enrollment object in response, but status is OK');
          }
        }
      } else {
        console.error('[DEBUG] ❌ Course assignment failed - unexpected status:', response.status);
      }
      
      return response.data;
    } catch (error) {
      console.error('[DEBUG] ❌ assignStudentToCourse error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
  },

  getStudentEnrollments: async (studentId) => {
    console.log('[DEBUG] getStudentEnrollments called for studentId:', studentId);
    try {
      // Backend endpoint: GET /api/admin/students/{studentId}/enrollments/
      // Backend returns: Array of enrollment objects
      // Each enrollment has: {id, student_id, course_id, course: {...}, enrollment_date, status}
      const response = await apiClient.get(`/admin/students/${studentId}/enrollments/`);
      console.log('[DEBUG] getStudentEnrollments response:', {
        status: response.status,
        data: response.data,
        dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
        dataLength: Array.isArray(response.data) ? response.data.length : (response.data?.enrollments?.length || 0)
      });
      
      // Backend returns array directly
      const data = response.data;
      if (Array.isArray(data)) {
        console.log('[DEBUG] ✅ Returning enrollments array with', data.length, 'items');
        return data;
      }
      
      // Fallback: if response is wrapped in object
      const enrollments = data?.enrollments || [];
      console.log('[DEBUG] ⚠️ Response was not array, extracted enrollments:', enrollments.length);
      return enrollments;
    } catch (error) {
      console.error('[DEBUG] ❌ getStudentEnrollments error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      throw error;
    }
  },

  removeStudentFromCourse: async (studentId, enrollmentId) => {
    console.log('[DEBUG] removeStudentFromCourse called:', {
      studentId,
      enrollmentId,
      url: `/admin/students/${studentId}/enrollments/${enrollmentId}/`
    });
    
    try {
      const response = await apiClient.delete(`/admin/students/${studentId}/enrollments/${enrollmentId}/`);
      console.log('[DEBUG] removeStudentFromCourse response:', {
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('[DEBUG] ✅ Course removal successful on backend');
      } else {
        console.error('[DEBUG] ❌ Course removal failed - unexpected status:', response.status);
      }
      
      return response.data;
    } catch (error) {
      console.error('[DEBUG] ❌ removeStudentFromCourse error:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      throw error;
    }
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
    try {
      const response = await apiClient.get('/admin/approvals/pending/');
      console.log('[getPendingApprovals] Response:', response);
      const data = response.data;
      return Array.isArray(data) ? data : (data?.results || data?.pending_approvals || data || []);
    } catch (error) {
      console.error('[getPendingApprovals] Error fetching pending approvals:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        data: error.data,
        fullError: error
      });
      // 403 hatası için özel mesaj
      if (error.status === 403) {
        console.error('[getPendingApprovals] 403 Forbidden - Backend permission sorunu. Backend geliştiricisi ile iletişime geçin.');
      }
      throw error;
    }
  },

  approveRequest: async (approvalId) => {
    const { data } = await apiClient.post(`/admin/approvals/${approvalId}/approve/`);
    return data;
  },

  rejectRequest: async (approvalId) => {
    const { data } = await apiClient.post(`/admin/approvals/${approvalId}/reject/`);
    return data;
  },

  // Student Options (for dropdowns) - gets from localStorage or returns defaults
  getStudentOptions: () => {
    try {
      const stored = localStorage.getItem('studentOptions');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading student options:', error);
    }
    // Return defaults if nothing stored
    return {
      majors: [],
      cohorts: [],
      advisors: []
    };
  },

  // Save student options to localStorage
  saveStudentOptions: (options) => {
    try {
      localStorage.setItem('studentOptions', JSON.stringify(options));
    } catch (error) {
      console.error('Error saving student options:', error);
    }
  }
};

export default adminService;

