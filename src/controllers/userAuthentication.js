const User = require("../models/user");
const validate = require('../utils/validator');
const bcrypt = require("bcrypt");
const redisClient = require("../config/redis")
const jwt = require('jsonwebtoken');
const admin = require('firebase-admin');
const transporter = require('../config/nodemailer');
const nodemailer = require('nodemailer');
const otpGenerator = require("otp-generator")


/**
 * Sends an OTP to the user's email.
 */
const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });

  // The key will be the user's email
  const redisKey = `otp:${email}`;
  const expirationInSeconds = 600; // 10 minutes

  console.log(`Generated OTP for ${email}: ${otp}`);

  const mailOptions = {
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your OTP for Email Verification',
    text: `Your One-Time Password is: ${otp}`,
  };

  try {
    // Use Redis to store the OTP with a 10-minute expiration
    await redisClient.set(redisKey, otp, {
      EX: expirationInSeconds,
    });
    
    // Send the email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'OTP sent successfully.' });
  } catch (error) {
    console.error('Error in sendOtp:', error);
    res.status(500).json({ error: 'Failed to send or store OTP.' });
  }
};

// const verifyOtp = async (req, res) => {
//   const { email, otp } = req.body;
//   if (!email || !otp) {
//     return res.status(400).json({ error: 'Email and OTP are required.' });
//   }

//   const redisKey = `otp:${email}`;

//   try {
//     // Fetch OTP from Redis
//     const storedOtp = await redisClient.get(redisKey);

//     if (!storedOtp) {
//       // This case handles both non-existent and expired OTPs
//       return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
//     }

//     if (storedOtp === otp) {
//       // OTP is correct, delete it from Redis to prevent reuse
//       await redisClient.del(redisKey);
//       return res.status(200).json({ message: 'Email verified successfully!' });
//     } else {
//       return res.status(400).json({ error: 'Invalid OTP.' });
//     }
//   } catch (error) {
//     console.error('Error in verifyOtp:', error);
//     res.status(500).json({ error: 'Server error during OTP verification.' });
//   }
// };


const register = async (req, res) => {
  const { firstName, emailID, password, otp } = req.body;

  // 1. Validate incoming data
  if (!firstName || !emailID || !password || !otp) {
    return res.status(400).json({ error: 'First name, email, password, and OTP are required.' });
  }

  const redisKey = `otp:${emailID}`;

  try {
    // 2. Fetch the OTP from Redis
    const storedOtp = await redisClient.get(redisKey);

    if (!storedOtp) {
      return res.status(400).json({ error: 'Invalid or expired OTP. Please request a new one.' });
    }

    if (storedOtp !== otp) {
      return res.status(400).json({ error: 'Invalid OTP.' });
    }

    // 3. OTP is correct, proceed with registration
    // Delete the OTP from Redis to prevent reuse
    await redisClient.del(redisKey);

    // Check if user already exists
    const existingUser = await User.findOne({ emailID });
    if (existingUser) {
        return res.status(400).json({ error: 'A user with this email already exists.' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new user
    const user = await User.create({
      firstName,
      emailID,
      password: hashedPassword,
      role: 'user'
    });

    // 4. Generate JWT token
    const token = jwt.sign({ _id: user._id, emailID: user.emailID }, process.env.JWT_KEY, {
      expiresIn: '1h', // 1 hour
    });

    // 5. Set the token in an HTTP-only cookie for security
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use 'true' in production
      sameSite: "lax",
      maxAge: 60 * 60 * 1000 // 1 hour in milliseconds
    });

    const reply = {
        firstName: user.firstName,
        emailId: user.emailID, // Corrected to match schema if it's 'emailID'
        _id: user._id
    };

    // 6. Send success response
    res.status(201).json({
        user: reply,
        message: "User registered successfully."
    });

  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).send({ error: "Server error during registration." });
  }
};




const login=async (req,res)=>{
    try{
        const {emailID, password} = req.body;

        if(!emailID)
            throw new Error("Invalid Credentials");
        if(!password)
            throw new Error("Invalid Credentials");

        const user = await User.findOne({emailID});

        const match = await bcrypt.compare(password,user.password);

        if(!match)
            throw new Error("Invalid Credentials");
        

        const token =  jwt.sign({_id:user._id , emailID:emailID, role:user.role},process.env.JWT_KEY,{expiresIn: 60*60});
        res.cookie("token", token, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          maxAge: 60 * 60 * 1000
        });

        const reply={
            firstName: user.firstName,
            emailID: user.emailID,
            _id: user._id,
            role: req.result.role,
        }
        res.status(200).json({
            message: "Login Successful",
            user: reply
        })
    }
    catch(err){
        res.status(401).send('Error '+err)
    }
}

const logout=async(req,res)=>{
    try{
        const {token} = req.cookies;
        const payload = jwt.decode(token);

        await redisClient.set(`token:${token}`,'Blocked');
        await redisClient.expireAt(`token:${token}`,payload.exp);
  

    res.cookie("token",null,{expires: new Date(Date.now())});
    res.send("Logged Out Succesfully");

    }
    catch(err){
       res.status(503).send("Error: "+err);
    }
}

// const logout = async (req, res) => {
//     try {
//         const { token } = req.cookies;

//         if (!token) {
//             return res.status(401).send("No token provided, already logged out.");
//         }

//         // Use verify to ensure the token is valid before using it
//         const payload = jwt.verify(token, process.env.JWT_SECRET); // Use your JWT secret key

//         // Your Redis logic is good for creating a blocklist.
//         // It prevents this token from being used again before it expires.
//         const expiryInSeconds = payload.exp;
//         await redisClient.set(`token:${token}`, 'Blocked');
//         await redisClient.expireAt(`token:${token}`, expiryInSeconds);

//         // Use the standard clearCookie method.
//         // The name "token" must match the name used during login.
        
//       res.cookie("token",null,{expires: new Date(Date.now())});

//         res.status(200).send("Logged Out Successfully");

//     } catch (err) {
//         // If jwt.verify fails (e.g., invalid signature), it will throw an error.
//         // We can still clear the cookie as a fallback.
//         res.clearCookie("token");
//         res.status(500).send("Error during logout: " + err.message);
//     }
// }
const adminRegister = async(req,res)=>{
    try{
          
      validate(req.body); 
      const {firstName, emailID, password}  = req.body;

      req.body.password = await bcrypt.hash(password, 10);
    
    
     const user =  await User.create(req.body);
     const token =  jwt.sign({_id:user._id , emailID:emailID},process.env.JWT_KEY,{expiresIn: 60*60});
     res.cookie('token',token,{maxAge: 60*60*1000});
     res.status(201).send("User Registered Successfully As Admin");
    }
    catch(err){
        res.status(400).send("Error: "+err);
    }
}
const deleteProfile = async(req,res)=>{
  
    try{
       const userId = req.result._id;
      
    // userSchema delete
    await User.findByIdAndDelete(userId);

    // Submission se bhi delete karo...
    
    // await Submission.deleteMany({userId});
    
    res.status(200).send("Deleted Successfully");

    }
    catch(err){
      
        res.status(500).send("Internal Server Error");
    }
}

const checkauth= async(req,res)=>{

    const reply = {
        firstName: req.result.firstName,
        emailId: req.result.emailId,
        _id:req.result._id,
        role: req.result.role,
    }

    res.status(200).json({
        user:reply,
        message:"Valid User"
    });
}

const socialLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(401).json({ message: 'Authentication token not provided.' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const { uid, name, email, picture } = decodedToken;
    const providerId = decodedToken.firebase?.sign_in_provider || "unknown";

    let user = await User.findOne({ emailID: email });
    let message;
    let statusCode;

    if (user) {
      // --- Existing user ---
      user.firebaseUid = uid;
      user.displayName = name;
      user.photoURL = picture || user.photoURL;
      user.providerId = providerId;

      await user.save();
      message = 'User account updated and authenticated successfully!';
      statusCode = 200;
    } else {
      // --- New user ---
      const newUser = new User({
        firebaseUid: uid,
        emailID: email,
        displayName: name,
        photoURL: picture || "",
        providerId,
        firstName: name?.split(" ")[0] || "User",
        password: "SOCIAL_LOGIN_USER_DOES_NOT_USE_PASSWORD",
      });

      user = await newUser.save();
      message = 'New user created and authenticated successfully!';
      statusCode = 201;
    }

    const token = jwt.sign(
      {
        _id: user._id,
        emailID: user.emailID,
        role: user.role || "user",
      },
      process.env.JWT_KEY,
      { expiresIn: 60 * 60 }
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: false, // Should be true in production with HTTPS
      sameSite: "lax",
      maxAge: 60 * 60 * 1000,
    });

    return res.status(statusCode).json({
      message,
      user: {
        id: user._id,
        firebaseUid: user.firebaseUid,
        displayName: user.displayName,
        emailID: user.emailID,
        photoURL: user.photoURL,
        role:user.role
      },
    });

  } catch (error) {
    console.error('Error during social login:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'Conflict: A user with this email has just been created.' });
    }

    return res.status(401).json({
      message: 'Authentication failed. Invalid or expired token.',
      error: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}, '-password'); // Exclude passwords from the result
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { userId } = req.params;
        const { role } = req.body;

        // Ensure the logged-in user is not trying to change their own role
        if (req.result._id.toString() === userId) {
            return res.status(403).json({ message: "You cannot change your own role." });
        }

        // Validate the role
        if (role !== 'user' && role !== 'admin') {
            return res.status(400).json({ message: 'Invalid role specified.' });
        }

        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { role },
            { new: true, runValidators: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found.' });
        }

        res.status(200).json(updatedUser);
    } catch (error) {
        res.status(500).json({ message: 'Error updating user role', error: error.message });
    }
};



module.exports={register,login,logout,adminRegister,deleteProfile,socialLogin,checkauth,sendOtp,getAllUsers,updateUserRole};