import apiClient from './apiClient';

const buildPath = (studentId, resource) =>
  `/students/${studentId}/${resource}/`;

const studentService = {
  getAssessments: async (studentId) => {
    const { data } = await apiClient.get(buildPath(studentId, 'assessments'));
    return data;
  },

  getLearningOutcomes: async (studentId) => {
    const { data } = await apiClient.get(buildPath(studentId, 'learning-outcomes'));
    return data;
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
    const { data } = await apiClient.get(buildPath(studentId, 'profile'));
    return data;
  }
};

export default studentService;

