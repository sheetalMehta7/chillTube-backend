import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from"../utils/ApiResponse.js";
 
const registerUser = asyncHandler(async (req, res, next) => {
  // get user data from frontend
  // check validations of data
  // check if user already exists
  // check for images, avatar if exists generate local path using multer
  // upload image to cloudinary
  // create a user and add to database
  // gerate the response and filter the password and refersh token

  const { username, email, fullName, password } = req.body;

  console.log(username, email, fullName, password)

  if (
    [username, email, fullName, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required.");
  }

  const userExists = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (userExists) {
    throw new ApiError(409, "User name or email already exists.");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage ? req.files?.coverImage[0]?.path : "";

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const avatar = await uploadFileOnCloudinary(avatarLocalPath);
  const coverImage = await uploadFileOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "Avatar file is required.");
  }

  const user = await User.create({
    fullName,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    username: username.toLowerCase(),
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if(!createdUser){
    throw new ApiError(500, "Something went wrong while regestering user.")
  }

  return res.status(201).json(new ApiResponse(200, createdUser, "User Resgitered Successfully."))

});

export { registerUser };
