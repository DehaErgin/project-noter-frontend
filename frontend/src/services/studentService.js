import apiClient from './apiClient';
import adminService from './adminService';

const buildPath = (studentId, resource) =>
  `/students/${studentId}/${resource}/`;

const studentService = {
  getAssessments: async (studentId) => {
    const { data } = await apiClient.get(buildPath(studentId, 'assessments'));
    return data;
  },

  getCourses: async (studentId) => {
    const coursesPath = buildPath(studentId, 'courses');
    
    try {
      // Backend endpoint: GET /api/students/{studentId}/courses/
      // Returns: Array of course objects [{id, code, name, ...}, ...]
      const response = await apiClient.get(coursesPath);
      const data = response.data;
      
      console.log(`[getCourses] Courses endpoint response for student ${studentId}:`, {
        path: coursesPath,
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : (data?.courses?.length || 0),
        data: data
      });
      
      // Backend returns array directly, or empty array if no enrollments
      if (Array.isArray(data)) {
        console.log(`[getCourses] Returning ${data.length} courses from array`);
        return data;
      }
      
      // Fallback: if response is wrapped in object
      const courses = data?.courses || [];
      console.log(`[getCourses] Returning ${courses.length} courses from object.courses`);
      return courses;
    } catch (error) {
      console.warn('[getCourses] Courses endpoint failed, trying fallbacks:', {
        studentId,
        path: coursesPath,
        status: error.response?.status,
        message: error.message
      });
      
      // Fallback 1: try learning-outcomes endpoint (now returns courses array too)
      try {
        const loPath = buildPath(studentId, 'learning-outcomes');
        const response = await apiClient.get(loPath);
        const data = response.data;
        
        console.log(`[getCourses] Learning-outcomes endpoint response:`, {
          path: loPath,
          hasCourses: !!data?.courses,
          coursesLength: data?.courses?.length || 0,
          data: data
        });
        
        // Backend now returns {courses: [...], learning_outcomes: [...]}
        if (data?.courses && Array.isArray(data.courses)) {
          console.log(`[getCourses] Returning ${data.courses.length} courses from learning-outcomes endpoint`);
          return data.courses;
        }
        
        // If it's an array (old format), return it
        if (Array.isArray(data)) {
          console.log(`[getCourses] Returning ${data.length} courses from array (old format)`);
          return data;
        }
      } catch (loError) {
        console.warn('[getCourses] Learning-outcomes endpoint also failed:', loError);
      }
      
      // Fallback 2: try enrollments endpoint
      try {
        const enrollmentsPath = buildPath(studentId, 'enrollments');
        const response = await apiClient.get(enrollmentsPath);
        const data = response.data;
        
        console.log(`[getCourses] Enrollments endpoint response:`, {
          path: enrollmentsPath,
          dataType: Array.isArray(data) ? 'array' : typeof data,
          dataLength: Array.isArray(data) ? data.length : 0,
          data: data
        });
        
        // Extract courses from enrollments array
        if (Array.isArray(data)) {
          // Each enrollment has a course property
          const courses = data.map(enrollment => enrollment.course).filter(Boolean);
          console.log(`[getCourses] Returning ${courses.length} courses from enrollments`);
          return courses;
        }
        
        const courses = data?.courses || [];
        console.log(`[getCourses] Returning ${courses.length} courses from enrollments object`);
        return courses;
      } catch (enrollError) {
        console.error('[getCourses] All endpoints failed:', enrollError);
        // Return empty array if all fail
        return [];
      }
    }
  },

  getLearningOutcomes: async (studentId, courseId = null) => {
    const url = courseId 
      ? buildPath(studentId, `learning-outcomes?course_id=${courseId}`)
      : buildPath(studentId, 'learning-outcomes');
    const { data } = await apiClient.get(url);
    
    // Backend now returns {courses: [...], learning_outcomes: [...]}
    // If courseId is specified, return only learning_outcomes array
    // If no courseId, return the full response (frontend can extract what it needs)
    if (courseId && data?.learning_outcomes) {
      return data.learning_outcomes;
    }
    
    // If it's an array (old format), return it
    if (Array.isArray(data)) {
      return data;
    }
    
    // Return learning_outcomes array if available, otherwise return data as-is
    return data?.learning_outcomes || data || [];
  },

  getProgramOutcomes: async (studentId) => {
    const { data } = await apiClient.get(buildPath(studentId, 'program-outcomes'));
    return data;
  },

  getDashboardSummary: async (studentId) => {
    const { data } = await apiClient.get(buildPath(studentId, 'dashboard'));
    return data;
  },

  getProfile: async (studentId) => {
    try {
      // Try to get profile from student endpoint
      const { data } = await apiClient.get(buildPath(studentId, 'profile'));
      return data;
    } catch (error) {
      // If student endpoint fails, try to get from admin students list
      try {
        const students = await adminService.getStudents();
        const student = students.find(
          (s) => 
            s.student_id === studentId || 
            s.id.toString() === studentId.toString() ||
            s.id === studentId
        );
        
        if (student) {
          // Return student data in profile format
          return {
            id: student.id,
            student_id: student.student_id || student.id.toString(),
            name: student.name || '',
            email: student.email || '',
            major: student.major || '',
            cohort: student.cohort || '',
            advisor: student.advisor || '',
            gpa: student.gpa || 'N/A'
          };
        }
        throw new Error('Student not found');
      } catch (adminError) {
        // If admin service also fails, check localStorage
        try {
          const storedInfo = localStorage.getItem('studentInfo');
          if (storedInfo) {
            const studentInfo = JSON.parse(storedInfo);
            if (studentInfo.student_id === studentId || studentInfo.id.toString() === studentId.toString()) {
              return {
                id: studentInfo.id,
                student_id: studentInfo.student_id,
                name: studentInfo.name || '',
                email: studentInfo.email || '',
                major: studentInfo.major || '',
                cohort: studentInfo.cohort || '',
                advisor: studentInfo.advisor || '',
                gpa: studentInfo.gpa || 'N/A'
              };
            }
          }
        } catch (localError) {
          // Ignore localStorage errors
        }
        throw error; // Re-throw original error if all fallbacks fail
      }
    }
  }
};

export default studentService;

