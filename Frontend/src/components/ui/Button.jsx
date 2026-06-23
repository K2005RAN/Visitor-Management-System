const Button = ({
  children,
  onClick,
  bgColor = "bg-blue-500 dark:bg-blue-600",
  textColor = "text-white",
  hoverColor = "hover:bg-blue-600 dark:hover:bg-blue-700",
  padding = "px-4 py-2",
  borderRadius = "rounded-md",
  className = "",
  ...props
}) => {
  return (
    <button
      onClick={onClick}
      className={`${bgColor} ${textColor} ${hoverColor} ${padding} ${borderRadius} ${className} 
        focus:outline-none cursor-pointer transition-colors duration-300 
        disabled:opacity-50 disabled:cursor-not-allowed`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
