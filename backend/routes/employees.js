import { Router } from "express";
import multer from "multer";
import { registerEmployee, listEmployees, deleteEmployee } from "../controllers/employeeController.js";

const upload = multer({ storage: multer.memoryStorage() });
const router = Router();

router.post("/", upload.array("photos", 10), registerEmployee);
router.get("/", listEmployees);
router.delete("/:rollNo", deleteEmployee);

export default router;
