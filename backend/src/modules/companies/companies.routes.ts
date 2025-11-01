import { Router } from "express";
import { companiesController } from "./companies.module";

const companyRoutes = Router();

companyRoutes.get("/adminPage", companiesController.getAllCompaniesAdminPage);
companyRoutes.post("/", companiesController.postCompany);
companyRoutes.put("/:id", companiesController.putCompany);
companyRoutes.delete("/:id", companiesController.deleteCompany);

export default companyRoutes;
