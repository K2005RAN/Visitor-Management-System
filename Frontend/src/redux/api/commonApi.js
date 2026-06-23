import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { baseURL } from "../../assets/assets.js";

export const commonApi = createApi({
  reducerPath: "commonApi",
  baseQuery: fetchBaseQuery({
    baseUrl: baseURL,
    // Critical for Cookies/JWT Authentication
    credentials: 'include', 
    prepareHeaders: (headers) => {
      headers.set("Accept", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Common", "Departments", "Employees"],
  endpoints: (builder) => ({
    
    // 1. Fetch all Departments for Dropdowns
    getDepartments: builder.query({
      query: () => "departments", 
      transformResponse: (response) =>
        response.data.map((item) => ({
          label: item.deptName,
          value: item.deptCode, 
        })),
      providesTags: ["Departments"],
    }),

    // 2. Fetch all Users/Employees with their Department details
    getEmployeesWithDepartments: builder.query({
      query: () => "users", 
      transformResponse: (response) =>
        response.data.map((emp) => ({
          label: emp.name,
          value: emp._id, // MongoDB Unique Object ID
          employeeId: emp.employee_id,
          employeeEmail: emp.employee_email,
          departmentId: emp.department_id,
        })),
      providesTags: ["Employees"],
    }),

    // 3. Add a new Department (Optional but helpful for the Manage UI)
    addDepartment: builder.mutation({
      query: (newDept) => ({
        url: "departments",
        method: "POST",
        body: newDept,
      }),
      invalidatesTags: ["Departments"],
    }),

  }),
});

// Updated export names to match the new endpoints
export const {
  useGetDepartmentsQuery,
  useGetEmployeesWithDepartmentsQuery,
  useAddDepartmentMutation,
} = commonApi;