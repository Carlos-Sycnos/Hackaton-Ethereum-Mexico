import { User } from "../../database/models/user";

export class UserService {
  public async findUserById(userId: number | string) {
    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] },
    });
    return user || null;
  }
}
