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
const payment_router=require("./routes/payment")
const aiRouter =require('./routes/aiChatting')
const videoRouter = require("./routes/videoCreator");
const cors = require('cors')
// const serviceAccount = require('../firebaseauth.json');
const admin = require('firebase-admin');
const cron = require('node-cron');
const Problem=require("./models/problem")
const discussion_router =require("./routes/discusion")
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';

app.use(cors({
    origin: allowedOrigin,
    credentials: true 
}));
const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT;
const serviceAccount = JSON.parse(serviceAccountString);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

app.use(express.json());
app.use(cookieParser());
app.use('/user',authRouter);
app.use('/problem',problemRouter);
app.use('/submission',submitRouter);
app.use('/ai',aiRouter);
app.use("/discussion",discussion_router)
app.use("/pay",payment_router)
app.use("/video",videoRouter);

cron.schedule('0 0 * * *', async () => {
    console.log('Running daily task: Selecting new Problem of the Day...');
    try {
        // Step 1: Unset the current Problem of the Day
        await Problem.findOneAndUpdate(
            { isProblemOfTheDay: true },
            { $set: { isProblemOfTheDay: false } }
        );

        let potentialProblemsCount = await Problem.countDocuments({ potdDate: "null" });
        
        // If the pool is empty, reset it and then update the count
        if (potentialProblemsCount === 0) {
            console.log('All problems have been used. Resetting the pool for today...');
            await Problem.updateMany({}, { $set: { potdDate: "null" } });
            
            // After resetting, the count is now the total number of problems
            potentialProblemsCount = await Problem.countDocuments(); 
        }

        // Step 3: Pick a random one from the list of potentials
        const randomIndex = Math.floor(Math.random() * potentialProblemsCount);
        const newPotd = await Problem.findOne({ potdDate: "null" }).skip(randomIndex);

        if (newPotd) {
            // Step 4: Set the new problem as the POTD
            newPotd.isProblemOfTheDay = true;
            newPotd.potdDate = new Date();
            await newPotd.save();
            // console.log(`New POTD selected: ${newPotd.title} (ID: ${newPotd._id})`);
        } else {
            console.log("Could not find a new problem to set as POTD, even after checks.");
        }
    } catch (error) {
        console.error('Error in POTD daily task:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Kolkata" 
});


const Connection = async ()=>{
    try{
        

        await Promise.all([main(),redisClient.connect()]);
        console.log("DB Connected");
        //  const existingPotd = await Problem.findOne({ isProblemOfTheDay: true });
        // if (!existingPotd) {
        //     // console.log("No POTD found on startup, selecting one now...");
        //     // You can run a simplified version of your cron job logic here
        //     const firstPotd = await Problem.findOne();
        //     if (firstPotd) {
        //         firstPotd.isProblemOfTheDay = true;
        //         firstPotd.potdDate = new Date();
        //         await firstPotd.save();
        //         // console.log(`Initial POTD set to: ${firstPotd.title}`);
        //     }
        // }
        
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
  