const Loader = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/30 dark:bg-gray-900/50 backdrop-blur-xs z-50 transition-colors duration-300">
      <div className="w-16 h-16 border-4 border-gray-300 dark:border-gray-600 border-t-blue-500 dark:border-t-blue-400 rounded-full animate-spin"></div>
    </div>
  );
};

export default Loader;
