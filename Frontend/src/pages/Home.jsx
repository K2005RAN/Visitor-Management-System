import { useSelector } from "react-redux";

const Home = () => {
  const { user } = useSelector((store) => store.auth);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-950 p-4 max-w-full flex items-center justify-center transition-colors duration-300">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-3">
          Welcome to the Dashboard, {user?.name}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-base max-w-xl mx-auto">
          We're glad to have you back. Here you can track your progress, manage
          your tasks, and explore insights tailored just for you.
        </p>
      </div>
    </div>
  );
};

export default Home;
