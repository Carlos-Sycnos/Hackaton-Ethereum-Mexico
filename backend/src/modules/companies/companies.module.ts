import { CompaniesController } from "./companies.controller";
import { CompanyService } from "./companies.service";

const companiesService = new CompanyService();
const companiesController = new CompaniesController(companiesService);

export { companiesService, companiesController };
