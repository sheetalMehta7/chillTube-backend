import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadFileOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (err) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access tokens."
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  // get user data from frontend
  // check validations of data
  // check if user already exists
  // check for images, avatar if exists generate local path using multer
  // upload image to cloudinary
  // create a user and add to database
  // gerate the response and filter the password and refersh token

  const { username, email, fullName, password } = req.body;

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
  const coverImageLocalPath = req.files?.coverImage
    ? req.files?.coverImage[0]?.path
    : "";

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

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while regestering user.");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User Resgitered Successfully."));
});

const loginUser = asyncHandler(async (req, res) => {
  // get user data from frontend.
  // validate the data
  // find the user in the db based on user email or user name
  // if user exists then check for passwrod, compare the passwords
  // if password is correct generate access and refresh token.
  // save refresh token in cookies and return access token in response.

  const { username, password, email } = req.body;

  if (!username && !email) {
    throw new ApiError(400, "Username or email is required.");
  }

  const user = User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User not found!");
  }

  const correctPassword = await user.comparePassword(password);

  if (!correctPassword) {
    throw new ApiError(401, "Incorrect password.");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken, //mobile application
        },
        "User logged in successfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res, next) => {
  //clear cookies, remove refreshToken
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );
  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully."));
});

const refershAccessToken = asyncHandler(async (req, res) => {
  // get refresh token from cookies or headers
  // jwt verify that token
  // get the user using that jwt token
  // compare the token of db with exisiting token
  // if true then user is correct generate new access and referesh token and send it to cookies.

  const incomingRefreshToken =
    req.cookies?.refershToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized request.");
  }

  try {
    const decodedToken = await jwt.verfiy(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
  
    const user = User.findById(decodedToken?._id);
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token.");
    }
  
    if (user.refershToken !== incomingRefreshToken) {
      throw new ApiError(401, "Refresh token is expired or used.");
    }
  
    const { accessToken, newRefreshToken } = await generateAccessAndRefreshTokens(
      user._id
    );
  
    const options = {
      httpOnly: true,
      secure: true,
    };
  
    res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: accessToken,
            refershToken: newRefreshToken,
          },
          "Access token successfully refreshed."
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token.");
  }
});


export const updateCurrentPassword = asyncHandler(async(req, res)=>{
  // password validation
  //i need to check the old password is same as the db password
  // then i need to compare the old password with new password it should not be same
  // then save the password in db
  // send info to user that password is updated 
  const {oldPassword, newPassword, confirmPassword} = req.body;
  
    const user = await User.findById(req.user?._id);
    const isPasswordSame = await user.comparePassword(oldPassword);
    if(!isPasswordSame){
      throw new ApiError(400, "Old password is incorrect.")
    }
    if(!(newPassword === confirmPassword)){
      throw new ApiError(400, "Password does not match with confirm password.")
    }
    user.password = newPassword;
    await user.save({validateBeforeSave: false});


    res.status(200).json(new ApiResponse(
      200, 
      {},
      "Password changed successfully."
    ))

})

export { registerUser, loginUser, logoutUser, refershAccessToken, updateCurrentPassword};
