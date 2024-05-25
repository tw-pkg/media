import dotenv from "dotenv";
import path from "node:path";

const __dirname = path.resolve();

export default () => {
  if (process.env.NODE_ENV === "production") {
    dotenv.config({ path: path.join(__dirname, ".env.prod") });
  } else {
    dotenv.config({ path: path.join(__dirname, ".env.dev") });
  }
};
