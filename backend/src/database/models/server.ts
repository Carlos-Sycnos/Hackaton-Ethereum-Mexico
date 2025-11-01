import cors from "cors";
import express, { Application } from "express";
import db from "../db_connection";
import { corsOptions } from "../../config/corsOptions";
import "./models_associations";
import { config } from "../../config/app.config";
import { errorHandler } from "../../middlewares/errorHandler";
import { routes } from "../../centralizations/routes";
import {
  authenticateJWT,
  setupJwtStrategy,
} from "../../common/strategies/jwt.strategy";
import passport from "passport";
import cookieParser from "cookie-parser";

class Server {
  private app: Application;
  private port: string;
  private apiPaths = {
    auth: "/auth",
    mfa: "/mfa",
    session: "/session",
    companies: "/companies",
  };

  constructor() {
    this.app = express();
    this.port = config.PORT;

    // DataBase Connection
    this.dbConnection();

    // Middlewares
    this.app.use(cors(corsOptions));
    this.app.options("*", cors(corsOptions));
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.static("public"));

    // Agrega cookie-parser antes de passport
    this.app.use(cookieParser());

    // Passport
    this.app.use(passport.initialize());
    setupJwtStrategy(passport); // <- registrar la estrategia aquí

    // Protected Routes And Controllers
    this.routes();

    //LETS SEE IF WORKS
    this.app.use(errorHandler);
  }

  async dbConnection() {
    try {
      await db.authenticate();
    } catch (error: any) {
      throw new Error(error);
    }
  }

  routes() {
    this.app.use(this.apiPaths.auth, routes.authRoutes);
    this.app.use(this.apiPaths.mfa, routes.mfaRoutes);
    this.app.use(this.apiPaths.session, authenticateJWT, routes.sessionRoutes);
    this.app.use(this.apiPaths.companies, routes.companyRoutes);
  }

  listen() {
    this.app.listen(this.port, () => {
      console.log(`Backend server is running on port ${this.port}`);
    });
  }

  getApp() {
    return this.app;
  }
}

export default Server;
