// const mongoose=require('mongoose')
// async function main(){
//     console.log('Connection string:', process.env.CONNECTION_STRING);
//     await mongoose.connect(process.env.CONNECTION_STRING);
    


// }
// module.exports=main;
const mongoose = require('mongoose');

async function main() {
    await mongoose.connect(process.env.CONNECTION_STRING)
}

module.exports = main;
