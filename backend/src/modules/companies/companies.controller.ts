import { Request, Response } from "express";
import { CompanyService } from "./companies.service";
import { asyncHandler } from "../../middlewares/asyncHandler";
import { HTTPSTATUS } from "../../config/http.config";

export class CompaniesController {
  private companyService: CompanyService;

  constructor(companyService: CompanyService) {
    this.companyService = companyService;
  }

  public getAllCompaniesAdminPage = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { companies, industries } =
        await this.companyService.getAllCompaniesAdminPage();

      return res.status(HTTPSTATUS.OK).send({ companies, industries });
    }
  );

  public postCompany = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { body } = req;
      await this.companyService.create(body);

      res
        .status(HTTPSTATUS.CREATED)
        .json({ message: "La compañía ha sido agregada exitosamente." });
    }
  );

  public putCompany = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { body } = req;
      await this.companyService.put(body);

      res
        .status(HTTPSTATUS.OK)
        .json({ message: "La compañía ha sido actualizada exitosamente." });
    }
  );

  public deleteCompany = asyncHandler(
    async (req: Request, res: Response): Promise<any> => {
      const { id } = req.params;
      await this.companyService.delete(Number(id));

      res
        .status(HTTPSTATUS.OK)
        .json({ message: "La compañía ha sido actualizada exitosamente." });
    }
  );
}
