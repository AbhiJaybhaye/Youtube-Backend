import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshTokens = async(userId) => {

    try {
        const user = await User.findById(userId); 

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating Refresh and Access token");
    }
}

const registerUser = asyncHandler(async (req, res) => {
    
    const { username, email, password, fullName} = req.body;

    if (!username || !email || !password || !fullName) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({$or:[{ username }, { email }]});

    if (existingUser) {
        throw new ApiError(400, "User already exists with this username or email");
    }

    const avatarLocalPath = req.files?.avatar[0].path;
    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Image upload failed");
    }

    const avatar = await uploadCloudinary(avatarLocalPath);
    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400, "Avatar is required");
    }

    const newUser = await User.create({ 
        username: username.toLowerCase(), 
        email, 
        password, 
        fullName, 
        avatar:avatar.url, 
        coverImage:coverImage?.url || null
    }); 

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    if(!createdUser) {
        throw new ApiError(500, "User not found, something went wrong");
    }

    return res.status(201).json(new ApiResponse(200, "User registered successfully", createdUser));
});

const loginUser = asyncHandler(async (req, res) => {

    const { username, email, password } = req.body;

    if (!email || !password) {
        throw new ApiError(400, "All fields are required");
    }    

    const user = await User.findOne({
        $or:[{ email }, { username}],
    });

    if(!user){
        throw new ApiError(404, "User not found");
    }
    
    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    };

    return res
    .status(200)
    .cookie("refreshToken", refreshToken, options)
    .cookie("accessToken", accessToken, options)
    .json(new ApiResponse(200, "User logged in successfully", {user: loggedInUser, accessToken, refreshToken}));  

});

const logoutUser = asyncHandler(async (req, res) => {

    await User.findByIdAndUpdate(
        req.user._id,
        { $unset: { refreshToken: 1 } },
        { new: true }
    );

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    try {

        const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

        if(!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request");
        }

        const decoded = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decoded?._id);

        if(!user) {
            throw new ApiError(401, "Invalid refresh token");
        }

        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired");
        }

        const options = {
            httpOnly: true,
            secure: true
        }
        
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);

        return res
        .status(200)
        .cookie("refreshToken", newRefreshToken, options)
        .cookie("accessToken", accessToken, options)
        .json(new ApiResponse(200, "Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(401, "Unauthorized request");
    }
});

const changePassword = asyncHandler(async (req, res) => {

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findById(req.user._id);
    const isPasswordValid = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid credentials");
    }

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res.status(200).json(new ApiResponse(200, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new ApiResponse(200, "User found successfully", req.user));
});

const updateAccountDetails = asyncHandler(async (req, res) => {

    const { fullName, email } = req.body;

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
        $set: {
            fullName,
            email
            }
        }, 
        {
            new: true
        }).select("-password");

    return res.status(200).json(new ApiResponse(200, "Account details updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {

   const avatarLocalPath = req.file?.path;

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is required");
    }

    const avatar = await uploadCloudinary(avatarLocalPath);

    if(!avatar.url) {
        throw new ApiError(500, "Something went wrong while uploading avatar");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
        $set: {
            avatar: avatar.url
            }
        }, 
        {
            new: true
        }).select("-password");

    return res.status(200).json(new ApiResponse(200, "Avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {

    const coverImageLocalPath = req.file?.path;

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover image is required");
    }

    const coverImage = await uploadCloudinary(coverImageLocalPath);

    if(!coverImage.url) {
        throw new ApiError(500, "Something went wrong while uploading cover image");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
        $set: {
            coverImage: coverImage.url
            }
        }, 
        {
            new: true
        }).select("-password");

    return res.status(200).json(new ApiResponse(200, "Cover image updated successfully", user));
});


export { 
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changePassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage 
};   