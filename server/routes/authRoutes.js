const express = require("express");
const authController = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/logout", authController.logout);
router.get("/me", protect, authController.getMe);
router.put("/updatedetails", protect, authController.updateDetails);
router.put("/updatepassword", protect, authController.updatePassword);
router.post("/forgotpassword", authController.forgotPassword);
router.put("/resetpassword/:resettoken", authController.resetPassword);

module.exports = router;
