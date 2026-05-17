import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { use } from "react";

const generateAccessAndRefreshTokens = async (userId)=>{
    try{
        const user= await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()
        user.refreshToken = refreshToken
        //tutorial does not added

        await user.save({validateBeforeSave:false})

        return{accessToken,refreshToken};

    }catch(error){
        console.log(error)
        throw new ApiError(500,"something went wrong while generating refresh and access token")
    }
    
}


const reegisterUser = asyncHandler(async(req,res)=>{
                // res.status(200).json({
                //     message:"seyammmmmmmmmmmmmmmmmmmmm"
                // })

                // get userdata from frontend
                //validation -not empty
                //chk if user already exists: username, email
                //chk for images,avatar
                //upload to cloudinary
                // create user object - create entry in db
                // remove password and refresh token field from response
                // check for user creation
                // return res

               const{fullName,email,username,password}= req.body
             console.log("fullName:",fullName,"email:",email,"username:",username,"password:",password,"email:",email)
            //  if(fullName ===""){
            //     throw new ApiError(400,"fullname is required")
            //  } 
         //   console.log(req)

                if (
                    [fullName,email,username,password].some((field)=>field?.trim()==="")
                ) {
                    throw new ApiError(400,"all fields are required")
                }
         //    res.json("hi")

             const existedUser= await User.findOne({
                    $or:[{username},{email}]
                })
            if(existedUser)
                {
                   throw new ApiError(409,"user with email or username already existed")
              }
            // const avatarLocalPath= req.files?.avatar[0]?.path ;
            //     const coverImageLocalPath= req.files?.coverImage[0]?.path ;


            const avatarLocalPath = req.files?.avatar?.[0]?.path;
            //const coverImageLocalPath = req.files?.coverImage?.[0]?.path;
           let coverImageLocalPath 
           if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length >0)
            {
                coverImageLocalPath = req.files.coverImage[0].path 
            }


             if (!avatarLocalPath) {
                throw new ApiError(400,"avatar file is required")
             }

             const avatar = await uploadOnCloudinary(avatarLocalPath);
             
            const coverImage = await uploadOnCloudinary(coverImageLocalPath);
              // console.log(coverImage);
             

             if(!avatar){
                throw new ApiError(500, "coudenary avatar upload failed")
             }

           /*   if(!coverImage){
                throw new ApiError(500, "coudenary cover image upload failed")
             }*/
             const user= await User.create({
                fullName,
                avatar:avatar.url,
                coverImage:coverImage?.url || "",
                email,
                password,
                username: username.toLowerCase()
            })

            const createdUser = await User.findById(user._id).select("-password -refreshToken")
            if(!createdUser){
                throw new ApiError(500,"something went wrong while registering the user");

            }
            return res.status(201).json(
                new ApiResponse(200,createdUser,"user created successfully")
            )
})  


const loginUser =asyncHandler(async (req,res)=>{
//req body -> data

// username or email
//find the user
//password check
// access  and refresh token
// send cookie



const {email,username,password}=req.body

if(!password){
    throw new ApiError(400,"password  is required")
}
if(!username && !email){
    throw new ApiError(400,"username or email is required")
}

const user =await User.findOne({
    $or:[{username},{email}]
})

if(!user){
    throw new ApiError(404,"user does not found ")
}

const isPasswordValid = await user.isPasswordCorrect(password)


if(!isPasswordValid){
    throw new ApiError(401,"invalid user credentials")
}



const {accessToken,refreshToken}= await generateAccessAndRefreshTokens(user._id)

const loggedInUser = await User.findById(user._id).select("-password -refreshToken")


const options ={
    httpOnly:true,
    secure:true
}

return res
.status(200)
.cookie("accessToken",accessToken,options)
.cookie("refreshToken",refreshToken,options)
.json(
    new ApiResponse(
        200,
        {
            user:loggedInUser,
            accessToken,
            refreshToken 
        },
        "user logged in successfully"
    )
)




})




const logoutUser = asyncHandler(async (req, res) => {
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
    .clearCookie("accessToken",  options)
    .clearCookie("refreshToken",  options)
    .json(new ApiResponse(200, {}, "user logged out successfully"));
});


const refreshAccessToken = asyncHandler(async (req,res)=>{

    const incommingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    // if(!incommingRefreshToken){
    //     throw new ApiError(401,"unauthorized request")
    // }
    if(!incommingRefreshToken){
        throw new ApiError(401,"unauthorized request")
    }

try {
    
        const decodedToken =jwt.verify(
            incommingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
    
        )
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
            
        }
        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"refresh token is expired or used")
        }
    
        const options ={
            httpOnly:true,
            secure:true
        }
    
        
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "access token refreshed successfully"
            )
        )
    
} catch (error) {
    throw new ApiError(401,error?.message || "invalid refresh token")
}
})


const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body

    const user = await User.findById(req.user?._id)
   const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
   if(!isPasswordCorrect){
    throw new ApiError(400,"invalid old password")
   }
   user.password = newPassword;
   await user.save({validateBeforeSave:false})
   

   return res
   .status(200)
   .json(new ApiResponse(200,{},"password changed successfully"))

})



const getCurrentUser = asyncHandler(async(req,res)=>{

return res
.status(200)
.json(new ApiResponse(200,req.user,"current user fatched successfully"))

})


const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {fullName,email} =req.body
    if(!fullName || !email)
    {
        throw new ApiError(400,"all fields are required")
    }

   const user = await  User.findByIdAndUpdate
   (    
    req.user?._id,
    {
            $set:{
                fullName,
                email
            }
    },
    {
        new:true
    }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,"account details updated successfully"))



})


const updateUserAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path

    if(!avatarLocalPath){
        throw new ApiError(400,"avater file is missing")
    }

    const avatar =await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(500, "error while uploading on cloudinary")
    }
    const user = req.user
    const usr = await User.findByIdAndUpdate
    (
        user?._id,
        {$set:{
            avatar:avatar.url
        }},
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,usr,"usr image is updated successfully"))
})


const updateUserCoverImage = asyncHandler(async(req,res)=>
{
    const coverImageLocalPath = req.file?.path
    if(!coverImageLocalPath){
        throw new ApiError(400,"cover image is not found")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if(!coverImage.url)
    {
        throw new ApiError(500,"something happening while uploading image on cloudinary")

    }
    const user = req.user
   const usr= User.findByIdAndUpdate(
        user._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {new:true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200,usr,"cover image is updated successfully"))
})

export {
    reegisterUser,
    loginUser,
    logoutUser ,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    

}; 