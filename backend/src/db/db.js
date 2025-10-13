const mongoose = require("mongoose");

async function connectDB(){
    try {
        await mongoose.connect(process.env.MONGO_URL)
        .then(()=>{
            console.log("Database connected successfully")
        })
    } catch (error) {
        console.log("Database connection failed:", error.message)
       
    }
}

module.exports = connectDB