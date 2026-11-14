import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * ProtectedRoute - Route protection with role-based access control
 * @param {React.Component} children - Component to render if authorized
 * @param {string|string[]} allowedRoles - Single role or array of roles allowed to access
 * @param {boolean} requireAuth - Whether authentication is required (default: true)
 */
const cleanRole = (role) => (role || '').toUpperCase().replace(/[\s_-]+/g, '');

export const getRoleDashboard = (role) => {
  const cRole = cleanRole(role);
  const roleDashboardMap = {
    'SUPERADMIN': '/superadmin/dashboard',
    'SUBADMIN': '/superadmin/dashboard',
    'ADMIN': '/admin/admin-dashboard',
    'MANAGER': '/manager/dashboard',
    'GENERALTRAINER': '/generaltrainer/dashboard',
    'TRAINER': '/generaltrainer/dashboard',
    'PERSONALTRAINER': '/personaltrainer/dashboard',
    'MEMBER': '/member/dashboard',
    'HOUSEKEEPING': '/housekeeping/dashboard',
    'RECEPTIONIST': '/receptionist/dashboard',
    'SALESAGENT': '/sales/dashboard',
  };
  return roleDashboardMap[cRole] || '/login';
};

const ProtectedRoute = ({ children, allowedRoles = null, requireAuth = true }) => {
  const location = useLocation();
  
  // Get authentication data from localStorage
  const token = localStorage.getItem('authToken');
  const userRole = localStorage.getItem('userRole');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // If authentication is required but no token exists, redirect to login
  if (requireAuth && !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If role-based access is specified, check if user has required role
  if (allowedRoles && userRole) {
    const cleanedUserRole = cleanRole(userRole);
    const cleanedAllowedRoles = Array.isArray(allowedRoles)
      ? allowedRoles.map(role => cleanRole(role))
      : [cleanRole(allowedRoles)];

    if (!cleanedAllowedRoles.includes(cleanedUserRole)) {
      // User doesn't have required role, redirect to their dashboard
      const redirectPath = getRoleDashboard(userRole);
      // Avoid infinite loop if already at target path
      if (location.pathname === redirectPath) {
        return children;
      }
      return <Navigate to={redirectPath} replace />;
    }

    // Additional sub-admin permission checklist routing protection
    if (cleanedUserRole === 'SUBADMIN') {
      const routeModuleMap = {
        '/superadmin/dashboard': 'Dashboard',
        '/sales/leads': 'Leads / Inquiries',
        '/admin/AdminBranches': 'Branches',
        '/superadmin/Admin': 'Gym Owners',
        '/superadmin/request-plan': 'Request Plan',
        '/superadmin/Plans&Pricing': 'Plans & Pricing',
        '/superadmin/payments': 'Payments',
        '/superadmin/setting': 'Setting',
        '/account': 'Setting',
      };

      const requiredModule = routeModuleMap[location.pathname];
      if (requiredModule) {
        let perms = user.permissions || [];
        if (typeof perms === 'string') {
          try {
            perms = JSON.parse(perms);
            if (typeof perms === 'string') {
              perms = JSON.parse(perms);
            }
          } catch (e) {
            perms = [];
          }
        }
        const permsArray = Array.isArray(perms) ? perms : [];

        if (!permsArray.includes(requiredModule)) {
          const subadminMenus = [
            { module: 'Dashboard', path: '/superadmin/dashboard' },
            { module: 'Leads / Inquiries', path: '/sales/leads' },
            { module: 'Branches', path: '/admin/AdminBranches' },
            { module: 'Gym Owners', path: '/superadmin/Admin' },
            { module: 'Request Plan', path: '/superadmin/request-plan' },
            { module: 'Plans & Pricing', path: '/superadmin/Plans&Pricing' },
            { module: 'Payments', path: '/superadmin/payments' },
            { module: 'Setting', path: '/superadmin/setting' }
          ];
          const firstPermitted = subadminMenus.find(m => permsArray.includes(m.module));
          const redirectPath = firstPermitted ? firstPermitted.path : '/login';
          return <Navigate to={redirectPath} replace />;
        }
      }
    }
  }

  // User is authenticated and authorized, render the component
  return children;
};

export default ProtectedRoute;


