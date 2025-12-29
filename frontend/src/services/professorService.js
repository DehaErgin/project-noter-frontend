import apiClient from './apiClient';

const professorService = {
  // Get professor by ID - uses admin endpoint
  getProfessor: async (professorId) => {
    const { data } = await apiClient.get('/admin/professors/');
    const professors = Array.isArray(data) ? data : (data.professors || []);
    const professor = professors.find(p => p.id.toString() === professorId.toString());
    if (!professor) {
      throw new Error('Professor not found');
    }
    return professor;
  },

  // Get professor by email (for login) - uses admin endpoint
  getProfessorByEmail: async (email) => {
    const { data } = await apiClient.get('/admin/professors/');
    const professors = Array.isArray(data) ? data : (data.professors || []);
    return professors.find(p => p.email?.toLowerCase() === email.toLowerCase()) || null;
  },

  // Get courses assigned to a professor - uses admin endpoint and filters
  getProfessorCourses: async (professorId) => {
    const { data } = await apiClient.get('/admin/courses/');
    const courses = Array.isArray(data) ? data : (data.courses || []);
    // Filter courses assigned to this professor
    return courses.filter(course =>
      course.professor_id && course.professor_id.toString() === professorId.toString()
    );
  },

  // Get a specific course for a professor - uses admin endpoint
  getProfessorCourse: async (professorId, courseId) => {
    const { data } = await apiClient.get('/admin/courses/');
    const courses = Array.isArray(data) ? data : (data.courses || []);
    const course = courses.find(c => c.id.toString() === courseId.toString());
    if (!course) {
      throw new Error('Course not found');
    }
    return course;
  },

  // Get students enrolled in a professor's course
  getCourseStudents: async (professorId, courseId) => {
    try {
      // Try generic course endpoint first (consistent with other professor methods)
      const { data } = await apiClient.get(`/courses/${courseId}/enrollments/`);
      const enrollments = Array.isArray(data) ? data : (data.enrollments || []);

      return enrollments.map(enrollment => {
        if (enrollment.student) {
          return {
            id: enrollment.student.id,
            student_id: enrollment.student.student_id || enrollment.student.id.toString(),
            name: enrollment.student.name,
            email: enrollment.student.email
          };
        }
        return {
          id: enrollment.student_id,
          student_id: enrollment.student_id?.toString() || '',
          name: enrollment.student_name || `Student ${enrollment.student_id}`,
          email: enrollment.student_email || ''
        };
      }).filter(Boolean);
    } catch (error) {
      console.warn('Generic enrollments endpoint failed, trying admin endpoint:', error);
      try {
        const { data } = await apiClient.get(`/admin/courses/${courseId}/enrollments/`);
        const enrollments = Array.isArray(data) ? data : (data.enrollments || []);
        return enrollments.map(enrollment => {
          if (enrollment.student) {
            return {
              id: enrollment.student.id,
              student_id: enrollment.student.student_id || enrollment.student.id.toString(),
              name: enrollment.student.name,
              email: enrollment.student.email
            };
          }
          return {
            id: enrollment.student_id,
            student_id: enrollment.student_id?.toString() || '',
            name: enrollment.student_name || `Student ${enrollment.student_id}`,
            email: enrollment.student_email || ''
          };
        }).filter(Boolean);
      } catch (adminError) {
        console.error('Error fetching course students:', adminError);
        return [];
      }
    }
  },

  // Get assessments for a course
  getCourseAssessments: async (professorId, courseId) => {
    try {
      const { data } = await apiClient.get(`/courses/${courseId}/assessments/`);
      return Array.isArray(data) ? data : (data.assessments || []);
    } catch (error) {
      console.error('Error fetching course assessments:', error);
      return [];
    }
  },

  // Create assessment for a course
  createAssessment: async (professorId, courseId, assessmentData) => {
    const { data } = await apiClient.post(`/courses/${courseId}/assessments/`, assessmentData);
    return data;
  },

  // Update assessment
  updateAssessment: async (professorId, courseId, assessmentId, assessmentData) => {
    const { data } = await apiClient.put(`/courses/${courseId}/assessments/${assessmentId}/`, assessmentData);
    return data;
  },

  // Delete assessment
  deleteAssessment: async (professorId, courseId, assessmentId) => {
    const { data } = await apiClient.delete(`/courses/${courseId}/assessments/${assessmentId}/`);
    return data;
  },

  // Get learning outcomes for a course
  getCourseLearningOutcomes: async (professorId, courseId) => {
    try {
      const { data } = await apiClient.get(`/courses/${courseId}/learning-outcomes/`);
      return Array.isArray(data) ? data : (data.learning_outcomes || []);
    } catch (error) {
      console.error('Error fetching course learning outcomes:', error);
      return [];
    }
  },

  // Create learning outcome for a course
  createCourseLearningOutcome: async (professorId, courseId, loData) => {
    const { data } = await apiClient.post(`/courses/${courseId}/learning-outcomes/`, loData);
    return data;
  },

  // Update learning outcome for a course
  updateCourseLearningOutcome: async (professorId, courseId, loId, loData) => {
    const { data } = await apiClient.put(`/courses/${courseId}/learning-outcomes/${loId}/`, loData);
    return data;
  },

  // Delete learning outcome from a course
  deleteCourseLearningOutcome: async (professorId, courseId, loId) => {
    const { data } = await apiClient.delete(`/courses/${courseId}/learning-outcomes/${loId}/`);
    return data;
  },

  // Save student grades
  saveStudentGrades: async (professorId, courseId, gradesData) => {
    const { data } = await apiClient.post(`/courses/${courseId}/grades/`, gradesData);
    return data;
  },

  // Get student grades for a course
  getStudentGrades: async (professorId, courseId) => {
    try {
      const { data } = await apiClient.get(`/courses/${courseId}/grades/`);
      return Array.isArray(data) ? data : (data.grades || []);
    } catch (error) {
      console.error('Error fetching student grades:', error);
      return [];
    }
  },

  // Create approval request
  createApprovalRequest: async (professorId, approvalData) => {
    try {
      const requestBody = {
        ...approvalData,
        requested_by: professorId
      };

      console.log('[createApprovalRequest] Creating approval request:', {
        professorId,
        url: '/admin/approvals/',
        requestBody
      });

      const response = await apiClient.post('/admin/approvals/', requestBody);

      console.log('[createApprovalRequest] Approval request created successfully:', response.data);

      return response.data;
    } catch (error) {
      console.error('[createApprovalRequest] Error creating approval request:', {
        error,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        professorId,
        approvalData
      });
      // Don't throw error - approval request failure shouldn't block the main operation
      return null;
    }
  }
};

export default professorService;
