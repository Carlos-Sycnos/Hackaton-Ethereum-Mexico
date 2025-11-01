import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import db from "../db_connection";
import { generateUniqueCode } from "../../common/utils/cryptoUniqueCode";
import { VerificationEnum } from "../../common/enums/verification-code.enum";

export class VerificationCode extends Model<
  InferAttributes<VerificationCode>,
  InferCreationAttributes<VerificationCode>
> {
  declare id: CreationOptional<number>;
  declare userId: number; // referencia a User
  declare code: CreationOptional<string>;
  declare type: VerificationEnum;
  declare expiresAt: Date;
  declare createdAt: CreationOptional<Date>;
}

VerificationCode.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      field: "user_id",
    },
    code: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      defaultValue: generateUniqueCode,
    },
    type: {
      type: DataTypes.ENUM(...Object.values(VerificationEnum)),
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "expires_at",
    },
  },
  {
    sequelize: db,
    tableName: "verification_codes",
    timestamps: false,
  }
);

export type VerificationCodeAttributes = InferAttributes<VerificationCode>;
export type VerificationCodeCreationAttributes =
  InferCreationAttributes<VerificationCode>;
