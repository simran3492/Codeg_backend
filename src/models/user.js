const mongoose=require('mongoose')
const {Schema}=mongoose;

const userSchema=new Schema({
    firstName:{
        type:String,
        required:true,
        minLength:2,
        maxLength:25
    },
    lastName:{
        type:String,
        minLength:2,
        maxLength:25

    },
    emailID:{
        type:String,
        required:true,
        unique:true,
        trim: true,
        lowercase:true,
        immutable: true,
    },
    age:{
        type:Number,
        min:6,
        max:80,
    },
    role:{
        type:String,
        enum:['user','admin'],
        default: 'user'
    },
    problemSolved:{
        type:[{
            type:Schema.Types.ObjectId,
            ref:'problem'
        }],
        unique:true
    },
    password:{
        type:String,
        required:true
    },
    firebaseUid: {
       type: String,
       // required: true,
       unique: true, // Each Firebase user has a unique UID
  },
  subscribed:{
        type:Boolean,
        default:false
    },
   displayName: {
       type: String,
       // required: true,
  },
   photoURL: {
        type: String,
  },
   providerId: {
         type: String, // e.g., 'google.com' or 'github.com'
        // required: true,
  }
},{
    timestamps:true,
});

userSchema.post('findOneAndDelete', async function (userInfo) {
    if (userInfo) {
      await mongoose.model('submission').deleteMany({ userId: userInfo._id });
    }
});

const User = mongoose.model("user",userSchema);

module.exports = User;