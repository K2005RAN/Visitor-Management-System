import { Router } from "express";
import authRoutes from "./auth.route.js";
import commonRoutes from "./common.route.js";
import visitorRoutes from "./visitor.route.js";
// 🟢 1. Import your brand-new department route file
import departmentRoutes from "./department.route.js"; 

const routers = Router();

routers.use("/auth", authRoutes);
routers.use("/shared", commonRoutes);
routers.use("/visitor", visitorRoutes);

// 🟢 2. Mount the department router onto the middleware stack
routers.use("/department", departmentRoutes); 

export default routers;