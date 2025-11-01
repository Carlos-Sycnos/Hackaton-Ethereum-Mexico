import { NotFoundException } from "../../common/utils/catch-errors";
import { Session } from "../../database/models/session";
import { User } from "../../database/models/user"; // si quieres incluir info del usuario
import { Op } from "sequelize";

export class SessionService {
  public async getAllSession(userId: number) {
    const sessions = await Session.findAll({
      where: {
        userId,
        expiredAt: { [Op.gt]: new Date() },
      },
      order: [["createdAt", "DESC"]],
    });

    return { sessions };
  }

  public async getSessionById(sessionId: number) {
    const session = await Session.findByPk(sessionId, {
      include: [
        {
          model: User,
          attributes: { exclude: ["password"] }, // si quieres traer info del usuario
        },
      ],
      attributes: { exclude: ["expiredAt"] },
    });

    if (!session) {
      throw new NotFoundException("Session not found");
    }

    return {
      user: session.userId, // aquí trae solo el ID si no incluyes User en include
    };
  }

  public async deleteSession(sessionId: number, userId: number) {
    const deletedCount = await Session.destroy({
      where: {
        id: sessionId,
        userId,
      },
    });

    if (!deletedCount) {
      throw new NotFoundException("Session not found");
    }

    return;
  }
}
