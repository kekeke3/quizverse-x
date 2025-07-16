const Room = require("../models/roomModel");
const Quiz = require("../models/quizModel");
const User = require("../models/userModel");
const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
const getRooms = asyncHandler(async (req, res, next) => {
  // If user is admin, get all rooms
  if (req.user.role === "admin") {
    res.status(200).json(res.advancedResults);
  } else {
    // Else get rooms where user is participant or creator
    const rooms = await Room.find({
      $or: [{ createdBy: req.user.id }, { "participants.user": req.user.id }],
    })
      .populate("createdBy", "username avatar")
      .populate("quiz", "title category");

    res.status(200).json({
      success: true,
      count: rooms.length,
      data: rooms,
    });
  }
});

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
const getRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id)
    .populate("createdBy", "username avatar")
    .populate("quiz", "title category")
    .populate("participants.user", "username avatar xp level");

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if user is room creator, participant, or admin
  const isParticipant = room.participants.some(
    (participant) => participant.user._id.toString() === req.user.id
  );

  if (
    room.createdBy._id.toString() !== req.user.id &&
    !isParticipant &&
    req.user.role !== "admin"
  ) {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to view this room`,
        401
      )
    );
  }

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private/Instructor,Admin
const createRoom = asyncHandler(async (req, res, next) => {
  // Check if quiz exists
  const quiz = await Quiz.findById(req.body.quiz);

  if (!quiz) {
    return next(
      new ErrorResponse(`Quiz not found with id of ${req.body.quiz}`, 404)
    );
  }

  // Make sure user is quiz owner or admin
  if (quiz.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to create a room with this quiz`,
        401
      )
    );
  }

  // Add user to req.body
  req.body.createdBy = req.user.id;

  const room = await Room.create(req.body);

  res.status(201).json({
    success: true,
    data: room,
  });
});

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Instructor,Admin
const updateRoom = asyncHandler(async (req, res, next) => {
  let room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner or admin
  if (room.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to update this room`,
        401
      )
    );
  }

  // Don't allow updating quiz if room has started
  if (room.startedAt && req.body.quiz) {
    return next(
      new ErrorResponse(`Cannot change quiz after room has started`, 400)
    );
  }

  room = await Room.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Instructor,Admin
const deleteRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner or admin
  if (room.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to delete this room`,
        401
      )
    );
  }

  await room.remove();

  res.status(200).json({
    success: true,
    data: {},
  });
});

// @desc    Join room
// @route   POST /api/rooms/:id/join
// @access  Private
const joinRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if room has started
  if (room.startedAt) {
    return next(new ErrorResponse(`Room has already started`, 400));
  }

  // Check if room has ended
  if (room.endedAt) {
    return next(new ErrorResponse(`Room has already ended`, 400));
  }

  // Check if user is already a participant
  const isParticipant = room.participants.some(
    (participant) => participant.user.toString() === req.user.id
  );

  if (isParticipant) {
    return next(
      new ErrorResponse(`User is already a participant in this room`, 400)
    );
  }

  // Check if room is full
  if (room.participants.length >= room.settings.maxParticipants) {
    return next(new ErrorResponse(`Room is full`, 400));
  }

  // Add user to participants
  room.participants.push({ user: req.user.id });
  await room.save();

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Leave room
// @route   POST /api/rooms/:id/leave
// @access  Private
const leaveRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Check if room has started
  if (room.startedAt) {
    return next(
      new ErrorResponse(`Cannot leave room after it has started`, 400)
    );
  }

  // Check if user is a participant
  const participantIndex = room.participants.findIndex(
    (participant) => participant.user.toString() === req.user.id
  );

  if (participantIndex === -1) {
    return next(
      new ErrorResponse(`User is not a participant in this room`, 400)
    );
  }

  // Remove user from participants
  room.participants.splice(participantIndex, 1);
  await room.save();

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    Start room
// @route   POST /api/rooms/:id/start
// @access  Private/Instructor,Admin
const startRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner or admin
  if (room.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to start this room`,
        401
      )
    );
  }

  // Check if room has already started
  if (room.startedAt) {
    return next(new ErrorResponse(`Room has already started`, 400));
  }

  // Check if room has ended
  if (room.endedAt) {
    return next(new ErrorResponse(`Room has already ended`, 400));
  }

  // Check if there are participants
  if (room.participants.length === 0) {
    return next(
      new ErrorResponse(`Cannot start room with no participants`, 400)
    );
  }

  // Start room
  room.startedAt = Date.now();
  await room.save();

  res.status(200).json({
    success: true,
    data: room,
  });
});

// @desc    End room
// @route   POST /api/rooms/:id/end
// @access  Private/Instructor,Admin
const endRoom = asyncHandler(async (req, res, next) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return next(
      new ErrorResponse(`Room not found with id of ${req.params.id}`, 404)
    );
  }

  // Make sure user is room owner or admin
  if (room.createdBy.toString() !== req.user.id && req.user.role !== "admin") {
    return next(
      new ErrorResponse(
        `User ${req.user.id} is not authorized to end this room`,
        401
      )
    );
  }

  // Check if room has already ended
  if (room.endedAt) {
    return next(new ErrorResponse(`Room has already ended`, 400));
  }

  // Check if room has started
  if (!room.startedAt) {
    return next(new ErrorResponse(`Room has not started yet`, 400));
  }

  // End room
  room.endedAt = Date.now();
  await room.save();

  // Award XP to participants
  await awardXpToParticipants(room);

  res.status(200).json({
    success: true,
    data: room,
  });
});

// Helper function to award XP to participants
const awardXpToParticipants = async (room) => {
  const participants = room.participants;

  for (const participant of participants) {
    await User.findByIdAndUpdate(participant.user, {
      $inc: { xp: participant.score },
    });
  }
};

module.exports = {
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  deleteRoom,
  joinRoom,
  leaveRoom,
  startRoom,
  endRoom,
};
