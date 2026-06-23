import { useState, useEffect, useRef } from "react";

const SelectField = ({
  label,
  name,
  options = [],
  value,
  onChange,
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [filteredOptions, setFilteredOptions] = useState(options);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const filtered = options.filter((opt) => {
      const label = typeof opt === "string" ? opt : opt.label;
      return label?.toLowerCase().includes(search.toLowerCase());
    });
    setFilteredOptions(filtered);
  }, [search, options]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (opt) => {
    const selectedValue = typeof opt === "string" ? opt : opt.value;
    const event = { target: { name, value: selectedValue } };
    onChange(event);
    setSearch("");
    setShowOptions(false);
  };

  const selectedLabel =
    options.find((opt) =>
      typeof opt === "string" ? opt === value : opt.value === value,
    )?.label || value;

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block font-semibold mb-1 text-sm text-gray-700 dark:text-gray-300 transition-colors duration-300">
          {label}
        </label>
      )}

      <input
        type="text"
        value={search || selectedLabel || ""}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
        className={`w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm
          bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-200
          placeholder-gray-400 dark:placeholder-gray-500
          focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-blue-500
          transition-colors duration-300 ${className}`}
        placeholder={`Search ${label?.toLowerCase() || ""}`}
      />

      {showOptions && (
        <ul
          className="absolute z-50 w-full mt-1 max-h-60 overflow-auto rounded-md shadow-lg
            bg-white dark:bg-gray-800 
            border border-gray-200 dark:border-gray-600
            transition-colors duration-300"
        >
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, idx) => {
              const optionLabel = typeof opt === "string" ? opt : opt.label;
              const optionValue = typeof opt === "string" ? opt : opt.value;
              const isSelected = optionValue === value;

              return (
                <li
                  key={idx}
                  className={`p-2 cursor-pointer text-sm transition-colors
                    ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  onClick={() => handleSelect(opt)}
                >
                  {optionLabel}
                </li>
              );
            })
          ) : (
            <li className="p-2 text-sm text-gray-500 dark:text-gray-400">
              No options found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default SelectField;
