import clsx from 'clsx';

const FormField = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options = null,
  rows = null
}) => {
  const inputClasses = clsx(
    'w-full px-4 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500',
    'bg-white dark:bg-slate-800 text-slate-900 dark:text-white',
    'border-slate-300 dark:border-slate-700',
    error && 'border-rose-500 focus:ring-rose-500'
  );

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
        {label}
        {required && <span className="ml-1 text-rose-500">*</span>}
      </label>
      {type === 'select' ? (
        <select id={name} name={name} value={value} onChange={onChange} className={inputClasses} required={required}>
          <option value="">Select {label.toLowerCase()}...</option>
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : type === 'textarea' ? (
        <textarea
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          rows={rows || 4}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
        />
      ) : (
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={inputClasses}
          required={required}
        />
      )}
      {error && <p className="text-sm text-rose-500">{error}</p>}
    </div>
  );
};

export default FormField;

