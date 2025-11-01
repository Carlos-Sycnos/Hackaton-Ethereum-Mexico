import industryRoutes from "../modules/industries/industries.routes";
import companyRoutes from "../modules/companies/companies.routes";
import authRoutes from "../modules/auth/auth.routes";
import mfaRoutes from "../modules/mfa/mfa.routes";
import sessionRoutes from "../modules/session/session.routes";

export const routes = {
  authRoutes,
  companyRoutes,
  industryRoutes,
  mfaRoutes,
  sessionRoutes,
};
