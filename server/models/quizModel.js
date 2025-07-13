const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: [true, "Please provide question text"],
  },
  options: {
    type: [String],
    required: [true, "Please provide options "],
    validate: {
      validator: function (options) {
        return options.length >= 2 && options.length <= 5;
      },
      message: "A question must have between 2 and 5 options",
    },
  },
  correctAnswer: {
    type: Number,
    required: [true, "Please provide the correct answer index"],
  },
  points: {
    type: Number,
    default: 10,
  },
  timeLimit: {
    type: Number,
    default: 30, // seconds
  },
  explanation: {
    type: String,
  },
  difficulty: {
    type: String,
    enum: ["easy", "medium", "hard"],
    default: "medium",
  },
});

const quizSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, "Please provide a quiz title"],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, "Title cannot be more than 100 characters"],
  },
  questions: {
    type: [questionSchema],
    required: [true, "Please provide questions"],
    validate: {
      validator: function (questions) {
        return questions.length > 0;
      },
      message: "A quiz must have at least one question",
    },
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  category: {
    type: String,
    required: [true, "Please provide a category"],
    enum: [
      "math",
      "science",
      "history",
      "geography",
      "language",
      "art",
      "music",
      "sports",
      "other",
    ],
  },
  isPublic: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

quizSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
