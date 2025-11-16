// API Base URL - Django backend endpoint
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Helper function for API requests
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    // Handle empty responses (e.g., DELETE requests)
    if (response.status === 204 || response.status === 201 && response.headers.get('content-length') === '0') {
      return null;
    }

    // Check if response is ok
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('API request failed:', error);
    throw error;
  }
};

// Assessment API
export const assessmentAPI = {
  getAll: async () => {
    return apiRequest('/assessments/');
  },
  getById: async (id) => {
    return apiRequest(`/assessments/${id}/`);
  },
  create: async (data) => {
    return apiRequest('/assessments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/assessments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/assessments/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Learning Outcome API
export const learningOutcomeAPI = {
  getAll: async () => {
    return apiRequest('/learning-outcomes/');
  },
  getById: async (id) => {
    return apiRequest(`/learning-outcomes/${id}/`);
  },
  create: async (data) => {
    return apiRequest('/learning-outcomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/learning-outcomes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/learning-outcomes/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Program Outcome API
export const programOutcomeAPI = {
  getAll: async () => {
    return apiRequest('/program-outcomes/');
  },
  getById: async (id) => {
    return apiRequest(`/program-outcomes/${id}/`);
  },
  create: async (data) => {
    return apiRequest('/program-outcomes/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/program-outcomes/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/program-outcomes/${id}/`, {
      method: 'DELETE',
    });
  },
};

// Enrollments API
export const enrollmentsAPI = {
  getAll: async () => {
    return apiRequest('/enrollments/');
  },
  getById: async (id) => {
    return apiRequest(`/enrollments/${id}/`);
  },
  create: async (data) => {
    return apiRequest('/enrollments/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  update: async (id, data) => {
    return apiRequest(`/enrollments/${id}/`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  delete: async (id) => {
    return apiRequest(`/enrollments/${id}/`, {
      method: 'DELETE',
    });
  },
  getByStudent: async (studentId) => {
    return apiRequest(`/enrollments/by_student/?student_id=${encodeURIComponent(studentId)}`);
  },
  getByCourse: async (courseId) => {
    return apiRequest(`/enrollments/by_course/?course_id=${encodeURIComponent(courseId)}`);
  },
};

