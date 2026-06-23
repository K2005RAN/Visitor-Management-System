const InputField = ({
  label,
  type,
  placeholder,
  value,
  onChange,
  name,
  required,
  className,
  widthClass,
}) => {
  return (
    <div className={`${className || ""}`}>
      {label && (
        <label className="block font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
          {label}
        </label>
      )}
      <input
        type={type || "text"}
        className={`p-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
          transition-colors duration-300
          ${widthClass || "w-full"}`}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        required={required}
      />
    </div>
  );
};

export default InputField;
