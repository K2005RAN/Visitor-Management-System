import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { FaChevronDown, FaChevronUp, FaBars, FaTimes } from "react-icons/fa";
import { useRoleAccess } from "../hooks/useRoleAccess.js";

const Sidebar = ({ isSidebarExpanded, toggleSidebar }) => {
  const { accessibleMenu } = useRoleAccess();
  const [expandedMenus, setExpandedMenus] = useState({});
  const location = useLocation();

  const toggleMenu = (menuKey) => {
    setExpandedMenus((prev) => ({
      ...Object.keys(prev).reduce((acc, key) => ({ ...acc, [key]: false }), {}),
      [menuKey]: !prev[menuKey],
    }));
  };

  const isActive = (path) =>
    location.pathname === path
      ? "bg-blue-500 text-white"
      : "text-gray-600 dark:text-gray-300";

  return (
    <aside
      className={`fixed min-h-screen 
        bg-white dark:bg-gray-900 
        text-gray-800 dark:text-white 
        border-r border-gray-200 dark:border-gray-700
        transition-all duration-300 ease-in-out ${
          isSidebarExpanded ? "w-64" : "w-16"
        } p-4 shadow-xl dark:shadow-gray-950 flex flex-col z-50`}
    >
      <div className="shrink-0">
        <div className="flex justify-between mb-4">
          {isSidebarExpanded && (
            <h1 className="text-2xl font-playfair text-gray-800 dark:text-white">
              Dashboard
            </h1>
          )}
          <button
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white focus:outline-none text-2xl cursor-pointer transition-colors"
            onClick={toggleSidebar}
            aria-label={
              isSidebarExpanded ? "Collapse sidebar" : "Expand sidebar"
            }
          >
            {isSidebarExpanded ? <FaTimes /> : <FaBars />}
          </button>
        </div>

        <ul className="space-y-4 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-100px)]">
          {accessibleMenu.map((menu) => {
            const MenuIcon = menu.icon;

            return (
              <li key={menu.key}>
                <div
                  className="flex items-center justify-between cursor-pointer p-3 rounded-lg 
                    hover:bg-gray-100 dark:hover:bg-gray-700 
                    text-gray-700 dark:text-gray-200
                    transition-colors"
                  onClick={() => toggleMenu(menu.key)}
                  role="button"
                  aria-expanded={expandedMenus[menu.key]}
                >
                  <div className="flex items-center">
                    <MenuIcon className="mr-3 shrink-0 text-gray-500 dark:text-gray-400" />
                    {isSidebarExpanded && (
                      <span className="font-semibold">{menu.label}</span>
                    )}
                  </div>
                  {isSidebarExpanded &&
                    (expandedMenus[menu.key] ? (
                      <FaChevronUp className="text-gray-400 dark:text-gray-500" />
                    ) : (
                      <FaChevronDown className="text-gray-400 dark:text-gray-500" />
                    ))}
                </div>

                {isSidebarExpanded && expandedMenus[menu.key] && (
                  <ul className="ml-6 mt-2 space-y-2 max-h-80 overflow-y-auto">
                    {menu.items.map((item) => (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={`block p-2 rounded-lg 
                            hover:bg-gray-100 dark:hover:bg-gray-700 
                            transition-colors ${isActive(item.path)}`}
                          onClick={() => window.scrollTo(0, 0)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
