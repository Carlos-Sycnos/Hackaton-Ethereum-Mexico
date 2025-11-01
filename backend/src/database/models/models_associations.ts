// src/models/associations.ts
import { Company } from "./company";
import { Industry } from "./industry";

/////////////////////////////////////////////////////        BELONGS TO        /////////////////////////////////////////////////////
// Una Company pertenece a una Industry
Company.belongsTo(Industry, {
  foreignKey: "industry_id",
});

/////////////////////////////////////////////////////        HAS MANY        /////////////////////////////////////////////////////
// Una Industry tiene muchas Companies
Industry.hasMany(Company, {
  foreignKey: "industry_id",
});
