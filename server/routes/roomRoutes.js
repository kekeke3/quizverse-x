const express = require("express");
const {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  startRoom,
  endRoom,
} = require("../controllers/roomController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/", getRooms);
router.get("/:id", getRoom);
router.post("/", authorize("instructor", "admin"), createRoom);
router.put("/:id", authorize("instructor", "admin"), updateRoom);
router.delete("/:id", authorize("instructor", "admin"), deleteRoom);
router.post("/:id/join", joinRoom);
router.post("/:id/leave", leaveRoom);
router.post("/:id/start", authorize("instructor", "admin"), startRoom);
router.post("/:id/end", authorize("instructor", "admin"), endRoom);

module.exports = router;
