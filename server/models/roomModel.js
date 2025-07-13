const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide a room name"],
    trim: true,
    maxlength: [50, "Room name cannot be more than 50 characters"],
  },
  quiz: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Quiz",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  participants: [
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      score: {
        type: Number,
        default: 0,
      },
      answer: [
        {
          questionId: mongoose.Schema.Types.ObjectId,
          answer: Number,
          isCorrect: Boolean,
          timeTaken: Number,
          pointsEarned: Number,
        },
      ],
    },
  ],
  isActive: {
    type: Boolean,
    default: true,
  },
  settings: {
    maxParticipants: {
      type: Number,
      default: 50,
    },
    showLeaderboard: {
      type: Boolean,
      default: true,
    },
    randomizeQuestions: {
      type: Boolean,
      default: false,
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  startedAt: {
    type: Date,
  },
  endedAt: {
    type: Date,
  },
});

const Room = mongoose.model("Room", roomSchema);

module.exports = Room;
