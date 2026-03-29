import mongoose from 'mongoose'
import dotenv from 'dotenv'
dotenv.config({
    path: process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development',
})

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/moosa-garage';

const connectDb = async () => {
    try {
        await mongoose.connect(MONGO_URI, { 
            dbName: 'moosa-garage'
        });
        console.log("MongoDB connected successfully!✅")
        console.log("🗄️ Database URI:", MONGO_URI.replace(/\/\/.*@/, '//***:***@')); // Hide credentials
        console.log("🗄️ Database name: moosa-garage")
        console.log("🗄️ Connection state:", mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected')
    } catch (error) {
        console.log("MongoDB connection failure❌", error)
        process.exit(1)
    }
}

export default connectDb