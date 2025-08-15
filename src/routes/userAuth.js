const express=require('express')
const authRouter=express.Router();
const {register,login,logout,adminRegister,deleteProfile,socialLogin,checkauth,sendOtp,getAllUsers,updateUserRole,update_user}=require('../controllers/userAuthentication');
const userMiddleware = require('../middleware/usermiddle');
const adminMiddleware = require('../middleware/adminMiddle');


authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/logout',userMiddleware,logout);
authRouter.post('/admin/register',adminMiddleware,adminRegister);
authRouter.delete('/deleteProfile',userMiddleware,deleteProfile);
authRouter.get('/check',userMiddleware,checkauth)
authRouter.get('/getalluser',adminMiddleware,getAllUsers)
authRouter.put('/role/:userId', adminMiddleware, updateUserRole);
authRouter.put("/updateUser",userMiddleware,update_user)

// authRouter.get('/check',userMiddleware,(req,res)=>{

//     const reply = {
//         firstName: req.result.firstName,
//         emailId: req.result.emailId,
//         _id:req.result._id
//     }

//     res.status(200).json({
//         user:reply,
//         message:"Valid User"
//     });
// })

authRouter.post('/social-login', socialLogin);

authRouter.post('/send-otp', sendOtp);


module.exports=authRouter;