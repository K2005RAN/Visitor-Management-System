// Convert "YYYY-MM-DD HH:MM:SS" → "YYYY-MM-DDTHH:MM:SS" for input
const toInputValue = (str) => str?.replace(" ", "T");

// Convert "YYYY-MM-DDTHH:MM:SS" → "YYYY-MM-DD HH:MM:SS"
const fromInputValue = (str) => str?.replace("T", " ");

const DateTimePicker = ({ label, value, onChange, name }) => {
  return (
    <div>
      {label && (
        <label className="block font-semibold mb-1 text-gray-700 dark:text-gray-300 text-sm transition-colors duration-300">
          {label}
        </label>
      )}
      <input
        type="datetime-local"
        step="1"
        name={name}
        className="w-full p-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
          focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
          transition-colors duration-300"
        value={toInputValue(value)}
        onChange={(e) => {
          const raw = e.target.value;
          const formatted = fromInputValue(raw);
          onChange({ target: { name, value: formatted } });
        }}
      />
    </div>
  );
};

export default DateTimePicker;
