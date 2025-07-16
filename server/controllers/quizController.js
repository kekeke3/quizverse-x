const Quiz = require("../models/quizModel");
const Room = require("../models/roomModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get all quizzes
// @route   GET /api/quizzes
// @access  Private
const getQuizzes = asyncHandler(async (req, res, next) => {
  // If user is admin, get all quizzes
  if (req.user.role === "admin") {
    res.status(200).json(res.advancedResults);
  } else {
    // Else get public quizzes and quizzes created by user
    const quizzes = await Quiz.find({
      $or: [{ isPublic: true }, { createdBy: req.user.id }],
    }).populate("createdBy", "username avatar");

    res.status(200).json({
      success: true,
      count: quizzes.length,
      data: quizzes,
    });
  }
});

// @desc    Get public quizzes
// @route   GET /api/quizzes/public
// @access  Public
const getPublicQuizzes = asyncHandler(async (req, res, next) => {
  const quizzes = await Quiz.find({ isPublic: true }).populate(
    "createdBy",
    "username avatar"
  );

  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes,
  });
});

// @desc    Get single quiz
// @route   GET /api/quizzes/:id
// @access  Private
const getQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).populate(
    "createdBy",
    "username avatar"
  );

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin or quiz is public
  if (
    quiz.createdBy._id.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    !quiz.isPublic
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this quiz`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

// @desc    Get quiz questions
// @route   GET /api/quizzes/:id/questions
// @access  Private
const getQuizQuestions = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id).select("questions");

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin or quiz is public
  if (
    quiz.createdBy.toString() !== req.user.id &&
    req.user.role !== "admin" &&
    !quiz.isPublic
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this quiz's questions`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    count: quiz.questions.length,
    data: quiz.questions,
  });
});

// @desc    Get quiz by room ID
// @route   GET /api/quizzes/room/:roomId
// @access  Private
const getQuizByRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.roomId);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.roomId}`, 404)
    );
  }

  // Check if user is room creator, participant, or admin
  const isParticipant = room.participants.some(
    (participant) => participant.user.toString() === req.user.id
  );

  if (
    room.createdBy.toString() !== req.user.id &&
    !isParticipant &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this quiz`,
        401
      )
    );
  }

  const quiz = await Quiz.findById(room.quiz).select(
    "-questions.correctAnswer"
  );

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

// @desc    Create new quiz
// @route   POST /api/quizzes
// @access  Private/Instructor,Admin
const createQuiz = asyncHandler(async (req, res, next) => {
  // Add user to req.body
  req.body.createdBy = req.user.id;

  const quiz = await Quiz.create(req.body);

  res.status(201).json({
    success: true,
    data: quiz,
  });
});

// @desc    Update quiz
// @route   PUT /api/quizzes/:id
// @access  Private/Instructor,Admin
const updateQuiz = asyncHandler(async (req, res, next) => {
  let quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this quiz`,
        401
      )
    );
  }

  quiz = await Quiz.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: quiz,
  });
});

// @desc    Delete quiz
// @route   DELETE /api/quizzes/:id
// @access  Private/Instructor,Admin
const deleteQuiz = asyncHandler(async (req, res, next) => {
  const quiz = await Quiz.findById(req.params.id);

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is quiz owner or admin
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this quiz`,
        401
      )
    );
  }

  await quiz.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

module.exports = {
  getQuizzes,
  getQuiz,
  createQuiz,
  updateQuiz,
  deleteQuiz,
  getQuizQuestions,
  getQuizByRoom,
  getPublicQuizzes,
};
