const User = require("../models/userModel");
const Quiz = require("../models/quizModel");
const Room = require("../models/roomModel");

const ErrorResponse = require("../utils/errorResponse");
const asyncHandler = require("../middleware/async");

// @desc Get all users
// @route GET /api/users

const getUsers = asyncHandler()

