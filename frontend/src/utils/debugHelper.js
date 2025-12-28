/**
 * Debug helper utilities for troubleshooting course assignment issues
 */

export const debugCourseAssignment = {
  /**
   * Log student ID information for debugging
   */
  logStudentIds: (student, context = '') => {
    console.group(`[DEBUG] Student IDs ${context}`);
    console.log('Student object:', student);
    console.log('student.id:', student?.id);
    console.log('student.student_id:', student?.student_id);
    console.log('localStorage studentId:', localStorage.getItem('studentId'));
    console.log('localStorage studentInfo:', localStorage.getItem('studentInfo'));
    console.groupEnd();
  },

  /**
   * Log course assignment request details
   */
  logAssignmentRequest: (studentId, courseId, studentObject) => {
    console.group('[DEBUG] Course Assignment Request');
    console.log('Student ID used:', studentId);
    console.log('Course ID:', courseId);
    console.log('Student object:', studentObject);
    console.log('Student.id:', studentObject?.id);
    console.log('Student.student_id:', studentObject?.student_id);
    console.groupEnd();
  },

  /**
   * Log courses endpoint response
   */
  logCoursesResponse: (studentId, response, endpoint = 'courses') => {
    console.group(`[DEBUG] Courses Response (${endpoint})`);
    console.log('Student ID:', studentId);
    console.log('Response status:', response?.status);
    console.log('Response data:', response?.data);
    console.log('Data type:', Array.isArray(response?.data) ? 'array' : typeof response?.data);
    console.log('Data length:', Array.isArray(response?.data) ? response?.data.length : (response?.data?.courses?.length || 0));
    console.groupEnd();
  },

  /**
   * Compare student IDs to find mismatches
   */
  compareStudentIds: (id1, id2, context = '') => {
    console.group(`[DEBUG] Student ID Comparison ${context}`);
    console.log('ID 1:', id1, '(type:', typeof id1, ')');
    console.log('ID 2:', id2, '(type:', typeof id2, ')');
    console.log('String comparison:', id1?.toString() === id2?.toString());
    console.log('Strict equality:', id1 === id2);
    console.log('Match:', id1?.toString() === id2?.toString() || id1 === id2);
    console.groupEnd();
  }
};

export default debugCourseAssignment;

