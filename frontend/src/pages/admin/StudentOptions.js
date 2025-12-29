import { useState, useEffect, useCallback, memo } from 'react';
import { useOutletContext } from 'react-router-dom';
import useAsyncResource from '../../hooks/useAsyncResource';
import adminService from '../../services/adminService';

const OptionList = memo(({ title, items, onAdd, newValue, setNewValue, onRemove }) => (
  <div className="p-6 bg-white rounded-2xl shadow-card ring-1 ring-slate-100 dark:bg-slate-900 dark:ring-slate-800">
    <h3 className="text-lg font-semibold mb-4">{title}</h3>
    
    <div className="flex gap-2 mb-4">
      <input
        type="text"
        value={newValue}
        onChange={(e) => setNewValue(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && onAdd()}
        placeholder={`Add new ${title.toLowerCase()}...`}
        className="flex-1 px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700"
      />
      <button
        onClick={onAdd}
        className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-brand-600 hover:bg-brand-700"
      >
        Add
      </button>
    </div>

    <div className="flex flex-wrap gap-2">
      {items.length === 0 ? (
        <p className="text-sm text-slate-500">No {title.toLowerCase()} added yet.</p>
      ) : (
        items.map((item) => (
          <span
            key={item}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200"
          >
            {item}
            <button
              onClick={() => onRemove(item)}
              className="text-rose-600 hover:text-rose-700 dark:text-rose-400"
              title="Remove"
            >
              ×
            </button>
          </span>
        ))
      )}
    </div>
  </div>
));

const StudentOptions = () => {
  const { adminId } = useOutletContext();
  const [options, setOptions] = useState({
    majors: [],
    cohorts: [],
    advisors: []
  });
  const [newMajor, setNewMajor] = useState('');
  const [newCohort, setNewCohort] = useState('');
  const [newAdvisor, setNewAdvisor] = useState('');
  const [success, setSuccess] = useState(null);

  const studentsLoader = useCallback(() => adminService.getStudents(), []);
  const { data: studentsData } = useAsyncResource(studentsLoader);

  const professorsLoader = useCallback(() => adminService.getProfessors(), []);
  const { data: professorsData } = useAsyncResource(professorsLoader);

  useEffect(() => {
    loadOptions();
  }, []);

  // Merge options with data from existing students and professors
  useEffect(() => {
    const storedOptions = adminService.getStudentOptions();
    
    // Extract unique values from students
    const majorsFromStudents = studentsData && studentsData.length > 0 
      ? [...new Set(studentsData.filter(s => s.major).map(s => s.major))].sort()
      : [];
    
    const cohortsFromStudents = studentsData && studentsData.length > 0
      ? [...new Set(studentsData.filter(s => s.cohort).map(s => s.cohort))].sort()
      : [];
    
    const advisorsFromStudents = studentsData && studentsData.length > 0
      ? [...new Set(studentsData.filter(s => s.advisor).map(s => s.advisor))].sort()
      : [];
    
    // Extract advisor names from professors (professors can be advisors)
    const advisorsFromProfessors = professorsData && professorsData.length > 0
      ? [...new Set(professorsData.filter(p => p.name).map(p => p.name))].sort()
      : [];
    
    // Merge stored options with values from students and professors (avoid duplicates)
    const mergedOptions = {
      majors: [...new Set([...storedOptions.majors, ...majorsFromStudents])].sort(),
      cohorts: [...new Set([...storedOptions.cohorts, ...cohortsFromStudents])].sort(),
      advisors: [...new Set([...storedOptions.advisors, ...advisorsFromStudents, ...advisorsFromProfessors])].sort()
    };
    
    setOptions(mergedOptions);
  }, [studentsData, professorsData]);

  const loadOptions = () => {
    const loadedOptions = adminService.getStudentOptions();
    setOptions(loadedOptions);
  };

  const saveOptions = useCallback((updatedOptions) => {
    adminService.saveStudentOptions(updatedOptions);
    setSuccess('Options saved successfully!');
    setTimeout(() => setSuccess(null), 3000);
  }, []);

  const addMajor = useCallback(() => {
    if (newMajor.trim()) {
      setOptions((prevOptions) => {
        if (!prevOptions.majors.includes(newMajor.trim())) {
          const updated = {
            ...prevOptions,
            majors: [...prevOptions.majors, newMajor.trim()].sort()
          };
          saveOptions(updated);
          return updated;
        }
        return prevOptions;
      });
      setNewMajor('');
    }
  }, [newMajor, saveOptions]);

  const removeMajor = useCallback((major) => {
    setOptions((prevOptions) => {
      const updated = {
        ...prevOptions,
        majors: prevOptions.majors.filter(m => m !== major)
      };
      saveOptions(updated);
      return updated;
    });
  }, [saveOptions]);

  const addCohort = useCallback(() => {
    if (newCohort.trim()) {
      setOptions((prevOptions) => {
        if (!prevOptions.cohorts.includes(newCohort.trim())) {
          const updated = {
            ...prevOptions,
            cohorts: [...prevOptions.cohorts, newCohort.trim()].sort()
          };
          saveOptions(updated);
          return updated;
        }
        return prevOptions;
      });
      setNewCohort('');
    }
  }, [newCohort, saveOptions]);

  const removeCohort = useCallback((cohort) => {
    setOptions((prevOptions) => {
      const updated = {
        ...prevOptions,
        cohorts: prevOptions.cohorts.filter(c => c !== cohort)
      };
      saveOptions(updated);
      return updated;
    });
  }, [saveOptions]);

  const addAdvisor = useCallback(() => {
    if (newAdvisor.trim()) {
      setOptions((prevOptions) => {
        if (!prevOptions.advisors.includes(newAdvisor.trim())) {
          const updated = {
            ...prevOptions,
            advisors: [...prevOptions.advisors, newAdvisor.trim()].sort()
          };
          saveOptions(updated);
          return updated;
        }
        return prevOptions;
      });
      setNewAdvisor('');
    }
  }, [newAdvisor, saveOptions]);

  const removeAdvisor = useCallback((advisor) => {
    setOptions((prevOptions) => {
      const updated = {
        ...prevOptions,
        advisors: prevOptions.advisors.filter(a => a !== advisor)
      };
      saveOptions(updated);
      return updated;
    });
  }, [saveOptions]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Student Options Management</h2>
        <p className="text-sm text-slate-500">
          Manage the dropdown options for Major, Cohort, and Advisor fields when creating/editing students.
        </p>
      </div>

      {success && (
        <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-lg dark:bg-emerald-500/10 dark:text-emerald-400">
          {success}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-1">
        <OptionList
          title="Majors"
          items={options.majors}
          onAdd={addMajor}
          newValue={newMajor}
          setNewValue={setNewMajor}
          onRemove={removeMajor}
        />

        <OptionList
          title="Cohorts"
          items={options.cohorts}
          onAdd={addCohort}
          newValue={newCohort}
          setNewValue={setNewCohort}
          onRemove={removeCohort}
        />

        <OptionList
          title="Advisors"
          items={options.advisors}
          onAdd={addAdvisor}
          newValue={newAdvisor}
          setNewValue={setNewAdvisor}
          onRemove={removeAdvisor}
        />
      </div>

      <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> These options will appear in the dropdown lists when creating or editing students. 
          Options are automatically saved when you add or remove items. Existing student data will also be included 
          in the dropdowns automatically.
        </p>
      </div>
    </div>
  );
};

export default StudentOptions;

