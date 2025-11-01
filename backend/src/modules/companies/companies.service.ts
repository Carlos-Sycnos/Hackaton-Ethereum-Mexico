import { NotFoundError } from "../../common/utils/customError";
import { Company } from "../../database/models/company";
import { Industry } from "../../database/models/industry";
import slugify from "slugify";
import { industriesService } from "../industries/industries.module";

export class CompanyService {
  //Individuales
  public async findAll() {
    return Company.findAll({
      include: [
        {
          model: Industry,
          attributes: ["name", "description"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
  }

  public async create(body: any) {
    const slug =
      slugify(body.name, {
        lower: true,
        strict: true,
        trim: true,
      }) + "-";

    const companyCreated = await Company.create({
      ...body,
      slug,
    });

    const newSlug = slug + "-" + companyCreated.id;

    await Company.update(
      { slug: newSlug },
      { where: { id: companyCreated.id } }
    );
  }

  public async put(body: any) {
    const company = await Company.findByPk(body.id);
    if (!company) throw new NotFoundError("La compañia con ese ID no existe.");

    await company.update(body);
  }

  public async delete(id: number) {
    const company = await Company.findByPk(id);
    if (!company) throw new NotFoundError("La compañia con ese ID no existe.");

    await company.destroy();
  }

  //Combinados
  public async getAllCompaniesAdminPage() {
    const [companies, industries] = await Promise.all([
      this.findAll(),
      industriesService.findAll(),
    ]);

    return { companies, industries };
  }
}
