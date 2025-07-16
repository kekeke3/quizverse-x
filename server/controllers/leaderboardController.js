const Room = require("../models/roomModel");
const User = require("../models/userModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get global leaderboard
// @route   GET /api/leaderboard
// @access  Private
const getLeaderboard = asyncHandler(async (req, res, next) => {
  // Get top 100 users by XP
  const leaderboard = await User.find({})
    .sort({ xp: -1, level: -1 })
    .limit(100)
    .select("username avatar xp level badges");

  res.status(200).json({
    success: true,
    count: leaderboard.length,
    data: leaderboard,
  });
});

// @desc    Get room leaderboard
// @route   GET /api/leaderboard/room/:roomId
// @access  Private
const getRoomLeaderboard = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.roomId).populate(
    "participants.user",
    "username avatar xp level"
  );

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.roomId}`, 404)
    );
  }

  // Check if user is participant or creator or admin
  const isParticipant = room.participants.some(
    (participant) => participant.user._id.toString() === req.user.id
  );

  if (
    room.createdBy.toString() !== req.user.id &&
    !isParticipant &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this leaderboard`,
        401
      )
    );
  }

  // Sort participants by score
  const sortedParticipants = [...room.participants].sort(
    (a, b) => b.score - a.score
  );

  res.status(200).json({
    success: true,
    data: sortedParticipants,
  });
});

// @desc    Update leaderboard (called via Socket.io)
// @route   PUT /api/leaderboard/update/:roomId
// @access  Private
const updateLeaderboard = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.roomId).populate(
    "participants.user",
    "username avatar xp level"
  );

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.roomId}`, 404)
    );
  }

  // Sort participants by score
  const sortedParticipants = [...room.participants].sort(
    (a, b) => b.score - a.score
  );

  res.status(200).json({
    success: true,
    data: sortedParticipants,
  });
});

// @desc    Get user's global rank
// @route   GET /api/leaderboard/rank
// @access  Private
const getUserRank = asyncHandler(async (req, res, next) => {
  // Count how many users have higher XP
  const rank = (await User.countDocuments({ xp: { $gt: req.user.xp } })) + 1;

  res.status(200).json({
    success: true,
    data: {
      rank,
      total: await User.countDocuments(),
    },
  });
});

module.exports = {
  getLeaderboard,
  updateLeaderboard,
  getRoomLeaderboard,
  getUserRank,
};
