const express = require("express");
const {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  getQuizByRoom,
  getPublicQuizzes,
} = require("../controllers/quizController");
const { protect, authorize } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect);

router.get("/public", getPublicQuizzes);
router.get("/", getQuizzes);
router.get("/:id", getQuiz);
router.get("/:id/questions", getQuizQuestions);
router.get("/room/:roomId", getQuizByRoom);
router.post("/", authorize("instructor", "admin"), createQuiz);
router.put("/:id", authorize("instructor", "admin"), updateQuiz);
router.delete("/:id", authorize("instructor", "admin"), deleteQuiz);

module.exports = router;
