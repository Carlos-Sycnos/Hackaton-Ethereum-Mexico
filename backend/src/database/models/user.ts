import {
  DataTypes,
  Model,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";
import db from "../db_connection";
import { hashValue, compareValue } from "../../common/utils/bcrypt";
import { generateUniqueCode } from "../../common/utils/cryptoUniqueCode";

interface UserPreferences {
  enable2FA: boolean;
  emailNotification: boolean;
  twoFactorSecret?: string | null;
}

export class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {
  declare id: CreationOptional<number>;
  declare publicId: CreationOptional<string>;
  declare name: CreationOptional<string>;
  declare surnames: CreationOptional<string>;
  declare email: string;
  declare password: string;
  declare is_email_verified: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
  declare userPreferences: CreationOptional<UserPreferences>;

  public comparePassword!: (value: string) => Promise<boolean>;
}

User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      field: "id",
    },
    publicId: {
      type: DataTypes.STRING(25),
      unique: true,
      allowNull: false,
      defaultValue: generateUniqueCode, // 👈 genera automáticamente el identificador aleatorio
      field: "public_id",
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "name",
    },
    surnames: {
      type: DataTypes.STRING(255),
      allowNull: true,
      field: "surnames",
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      field: "email",
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: "password",
    },
    is_email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: "is_email_verified",
    },
    userPreferences: {
      type: DataTypes.JSONB,
      defaultValue: {
        enable2FA: false,
        emailNotification: true,
        twoFactorSecret: null,
      },
      field: "user_preferences",
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: "updated_at",
    },
  },
  {
    sequelize: db,
    tableName: "users",
    timestamps: true,
    hooks: {
      beforeCreate: async user => {
        if (user.password) {
          user.password = await hashValue(user.password);
        }
      },
      beforeUpdate: async user => {
        if (user.changed("password")) {
          user.password = await hashValue(user.password);
        }
      },
    },
  }
);

// Método para comparar contraseña
User.prototype.comparePassword = async function (value: string) {
  return compareValue(value, this.password);
};

export type UserAttributes = InferAttributes<User>;
export type UserCreationAttributes = InferCreationAttributes<User>;
