import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import db from "../db_connection";
import { thirtyDaysFromNow } from "../../common/utils/date_time";

export class Session extends Model<
  InferAttributes<Session>,
  InferCreationAttributes<Session>
> {
  declare id: CreationOptional<number>;
  declare userId: number; // referencia a la tabla de usuarios
  declare userAgent: string;
  declare city: string;
  declare country: string;
  declare ip: string;
  declare deviceType: string;
  declare deviceName: string;
  declare osName: string;
  declare createdAt: CreationOptional<Date>;
  declare expiredAt: CreationOptional<Date>;
}

Session.init(
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
        model: "users", // nombre de la tabla de usuarios
        key: "id",
      },
      field: "user_id",
    },
    userAgent: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "user_agent",
    },
    city: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "city",
    },
    country: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "country",
    },
    ip: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "ip",
    },
    deviceType: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "device_type",
    },
    deviceName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "device_name",
    },
    osName: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "os_name",
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    expiredAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: thirtyDaysFromNow,
      field: "expired_at",
    },
  },
  {
    sequelize: db,
    tableName: "sessions",
    timestamps: false, // ya tienes createdAt manual
  }
);

export type SessionAttributes = InferAttributes<Session>;
export type SessionCreationAttributes = InferCreationAttributes<Session>;
