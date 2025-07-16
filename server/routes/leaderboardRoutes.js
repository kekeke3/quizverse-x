const express = require("express");
const {
  getLeaderboard,
  updateLeaderboard,
  getRoomLeaderboard,
  getUserRank,
} = require("../controllers/leaderboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getLeaderboard);
router.get("/room/:roomId", getRoomLeaderboard);
router.get("/rank", getUserRank);

// This would typically be called via Socket.io, but we expose it here for testing
router.put("/update/:roomId", updateLeaderboard);

module.exports = router;
