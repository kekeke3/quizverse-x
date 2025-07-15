const User = require("../models/userModel");
const Quiz = require("../models/quizModel");
const Room = require("../models/roomModel");

const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc Get all users
// @route GET /api/users
const getUsers = asyncHandler(async (req, res, next) => {
  res.status(200).json(res.advancedResults);
});

// @desc Get single user
// @route GET /api/users/me
// @route GET /api/users/:id

const getUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id || req.user.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is user or admin
  if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this user`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @desc Create user
// @route POST /api/users
const createUser = asyncHandler(async (req, res, next) => {
  const user = await User.create(req.body);

  res.status(201).json({
    success: true,
    data: user,
  });
});

// @desc Update user
// @route PUT /api/users/:id
const updateUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  if (user._id.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this user`,
        401
      )
    );
  }

  if (req.body.role && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update role`,
        401
      )
    );
  }

  user = await User.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: user,
  });
});

// @decs Delete user
// @route DELETE /api/users/:id
const deleteUser = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(
      new ResponseError(`User not found with id of ${req.params.id}`, 404)
    );
  }

  await user.remove();
  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc Get quizzes created by user
// @route GET /api/users/me/quizzes
const getUserQuizzes = asyncHandler(async (req, res, next) => {
  const quizzes = await Quiz.find({ createdBy: req.user.id });
  res.status(200).json({
    success: true,
    count: quizzes.length,
    data: quizzes,
  });
});

// @desc Get rooms created by user
// @route GET /api/users/me/rooms
const getUserRooms = asyncHandler(async (req, res, next) => {
  const rooms = await Room.find({ createdBy: req.user.id });

  res.status(200).json({
    success: true,
    count: rooms.length,
    data: rooms,
  });
});

// @desc Get user stats
// @route GET /api/users/me/stats
const getUserStats = asyncHandler(async (req, res, next) => {
  const stats = await Room.aggregate([
    { $match: { "participants.user": req.user._id } },
    { $unwind: "$participants" },
    { $match: { "participants.user": req.user._id } },
    {
      $group: {
        _id: null,
        totalQuizzes: { $sum: 1 },
        averageScore: { $avg: "$participants.score" },
        highestScore: { $max: "$participants.score" },
        categories: {
          $addToSet: "$category",
        },
      },
    },
  ]);

  if (stats.length === 0) {
    return res.status(200).json({
      success: true,
      data: {
        totalQuizzes: 0,
        averageScore: 0,
        highestScore: 0,
        categories: [],
      },
    });
  }

  res.status(200).json({
    success: true,
    data: stats[0],
  });
});

// @desc    Award badge to user
// @route   PUT /api/users/:id/badge
const awardBadge = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  const { name, description } = req.body;

  if (!name || !description) {
    return next(
      new ErrorResponse(`Please provide badge name and description`, 400)
    );
  }

  user.badges.push({
    name,
    description,
    earnedAt: Date.now(),
  });

  await user.save();

  res.status(200).json({
    success: true,
    data: user.badges,
  });
});

// @desc    Add XP to user
// @route   PUT /api/users/:id/xp
const addXp = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(
      new ErrorResponse(`User not found with id of ${req.params.id}`, 404)
    );
  }

  const { amount } = req.body;

  if (!amount || isNaN(amount)) {
    return next(new ErrorResponse(`Please provide a valid XP amount`, 400));
  }

  user.xp += parseInt(amount);

  // Check for level up (1000 XP per level)
  const newLevel = Math.floor(user.xp / 1000) + 1;
  if (newLevel > user.level) {
    user.level = newLevel;
  }

  await user.save();

  res.status(200).json({
    success: true,
    data: { xp: user.xp, level: user.level },
  });
});

module.exports = {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserQuizzes,
  getUserRooms,
  getUserStats,
  awardBadge,
  addXp,
};
