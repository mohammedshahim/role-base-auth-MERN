const asyncHandler = require("../middlewares/async");
const User = require("../models/User");

// @desc      Register customer from mobile
// @route     POST /api/v1/auth/register
// @access    Public
exports.register = asyncHandler(async (req, res, next) => {
  const { username, password, role } = req.body;

  if (!username || !password || !role) {
    return res.status(400).json({
      success: false,
      message: { error: "Please provide proper data" },
    });
  }

  // Check if user exists
  const user = await User.findOne({ username });
  let userExist = user ? true : false;

  if (userExist)
    return res.status(409).json({
      success: false,
      message: "User already Exist",
    });

  // Create user
  await User.create(req.body);

  let message = { success: "User Registered Successfuly" };
  res.status(200).json({
    success: true,
    message,
  });
});

/**
 * @desc    Login user
 * @route   POST /api/v1/auth/login
 * @access  Public
 */
exports.login = asyncHandler(async (req, res, next) => {
  const { username, password } = req.body;
  // Validate emil & password
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: { error: "Please provide mobile and password" },
    });
  }

  // Check for user
  const user = await User.findOne({ username }).select("+password");
  if (!user) {
    return next(new ErrorResponse("Please register to login", 401));
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    return next(new ErrorResponse("Invalid Credentials", 401));
  }
  sendTokenResponse(user, 0, 200, res);
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/v1/auth/me
 * @access  Private
 */
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    data: user,
  });
});

/**
 * @desc  Send token to response
 */
const sendTokenResponse = (user, otp, statusCode, res, message) => {
  // Create token
  const token = user.getSignedJwtToken();
  const options = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };
  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }
  if (otp) {
    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token,
      otp,
      message,
    });
  } else {
    res.status(statusCode).cookie("token", token, options).json({
      success: true,
      token,
      message,
    });
  }
};
