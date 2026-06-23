import { lazy } from "react";
import { FaUserShield } from "react-icons/fa6";

// Lazy loaded components
const Dashboard = lazy(() => import("../pages/Visitor/Dashboard"));
const GeneratePass = lazy(() => import("../pages/Visitor/GeneratePass"));
const VisitorPassDisplay = lazy(
  () => import("../pages/Visitor/VisitorPassDisplay"),
);
const InOut = lazy(() => import("../pages/Visitor/InOut"));
const Reports = lazy(() => import("../pages/Visitor/Reports"));
const History = lazy(() => import("../pages/Visitor/History"));
const ManageEmployee = lazy(() => import("../pages/Visitor/ManageEmployee"));

// Role constants for consistency
export const ROLES = {
  ADMIN: "admin",
  SECURITY: "security",
  HR: "hr",
};

// Centralized route configuration
export const ROUTE_CONFIG = [
  {
    key: "visitor",
    icon: FaUserShield,
    label: "Visitor",
    basePath: "/visitor",
    roles: [ROLES.ADMIN, ROLES.SECURITY, ROLES.HR],
    items: [
      {
        path: "/visitor/dashboard",
        label: "Dashboard",
        component: Dashboard,
      },
      {
        path: "/visitor/generate-pass",
        label: "Generate Pass",
        component: GeneratePass,
      },
      {
        path: "/visitor/in-out",
        label: "In / Out",
        component: InOut,
      },
      {
        path: "/visitor/reports",
        label: "Reports",
        component: Reports,
      },
      {
        path: "/visitor/history",
        label: "History",
        component: History,
      },
      {
        path: "/visitor/manage-employee",
        label: "Manage Employee",
        component: ManageEmployee,
        roles: [ROLES.ADMIN, ROLES.HR],
      },
    ],
    // Hidden routes (not shown in sidebar but accessible)
    hiddenItems: [
      {
        path: "/visitor-pass-display/:passId",
        component: VisitorPassDisplay,
      },
    ],
  },
];

// Utility function to check access
export const canAccess = (userRole, allowedRoles) => {
  if (!allowedRoles || allowedRoles.length === 0) return true;
  return allowedRoles.includes(userRole);
};

// Get filtered routes for a user
export const getAccessibleRoutes = (userRole) => {
  const routes = [];

  ROUTE_CONFIG.forEach((section) => {
    // Check section-level access
    if (section.roles && !canAccess(userRole, section.roles)) {
      return;
    }

    // Filter items
    const accessibleItems = section.items.filter((item) => {
      if (item.roles) return canAccess(userRole, item.roles);
      if (section.roles) return canAccess(userRole, section.roles);
      return true;
    });

    accessibleItems.forEach((item) => {
      routes.push({
        path: item.path,
        component: item.component,
      });
    });

    // Add hidden items if user has section access
    if (section.hiddenItems) {
      section.hiddenItems.forEach((item) => {
        routes.push({
          path: item.path,
          component: item.component,
        });
      });
    }
  });

  return routes;
};

// Get filtered menu for sidebar
export const getAccessibleMenu = (userRole) => {
  return ROUTE_CONFIG.map((section) => {
    // Check section-level access
    if (section.roles && !canAccess(userRole, section.roles)) {
      return null;
    }

    // Filter items (exclude hidden items from menu)
    const accessibleItems = section.items.filter((item) => {
      if (item.roles) return canAccess(userRole, item.roles);
      if (section.roles) return canAccess(userRole, section.roles);
      return true;
    });

    if (accessibleItems.length === 0) return null;

    return {
      ...section,
      items: accessibleItems,
    };
  }).filter(Boolean);
};
