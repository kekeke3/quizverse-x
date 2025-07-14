const express = require("express");
const userController = require("../controllers/userController");

const { protect, authorize } = require("../middleware/authMiddleware");
const router = exprexx.Router();

router.use(protect);

