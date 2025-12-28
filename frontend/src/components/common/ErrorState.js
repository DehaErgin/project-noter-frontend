const ErrorState = ({ message = 'Unable to load data.', onRetry }) => (
  <div className="flex flex-col items-center justify-center w-full py-12 text-red-500">
    <p className="mb-3 text-sm font-semibold">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="px-4 py-2 text-sm font-medium text-white rounded-md bg-brand-600 hover:bg-brand-700"
      >
        Retry
      </button>
    )}
  </div>
);

export default ErrorState;

