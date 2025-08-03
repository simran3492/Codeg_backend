const express = require('express');
const app = express();
require('dotenv').config();
// console.log('Working Directory:', __dirname);
const nodemailer = require('nodemailer');
const main=require('./config/database')
const cookieParser=require('cookie-parser')
const authRouter = require('./routes/userAuth');
const redisClient = require('./config/redis');
const problemRouter=require('./routes/problemRoute')
const submitRouter = require("./routes/submit")
const aiRouter =require('./routes/aiChatting')
const cors = require('cors')
const serviceAccount = require('./utils/firebaseauth.json');
const admin = require('firebase-admin');
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true 
}))

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());
app.use(cookieParser());
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);


const Connection = async ()=>{
    try{

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        
        app.listen(process.env.PORT, ()=>{
            console.log("Server listening at port number: "+ process.env.PORT);
        })

    }
    catch(err){
        console.log("Error: "+err);
    }
}

// module.exports = admin;
Connection();
// main()
// .then(async()=>{
//   app.listen(process.env.PORT,()=>{
//      console.log("listening at port number: "+ process.env.PORT);
//   })   
// })
	
// text/html; charset=utf-8
  