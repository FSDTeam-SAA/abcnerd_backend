import express from "express";
const router = express.Router();

import { userRoute } from "../modules/usersAuth/user.route";
import { categorywordRoute } from "../modules/categoryword/categoryword.routes";
import { wordmanagementRoute } from "../modules/wordmanagement/wordmanagement.routes";

router.use("/user", userRoute);
router.use("/categoryword", categorywordRoute);
router.use("/wordmanagement", wordmanagementRoute);



export default router;
