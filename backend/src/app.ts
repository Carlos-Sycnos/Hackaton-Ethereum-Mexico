import { name } from "./common/utils/functionsEther";
import Server from "./database/models/server";

const server = new Server();

server.listen();

export const app = server.getApp();
// name();
