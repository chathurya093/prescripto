import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import connectDB from './config/db.js'
import userRouter from './routes/userRoute.js'
import doctorRouter from './routes/doctorRoute.js'
import adminRouter from './routes/adminRoute.js'

// App config
const app = express()
const port = process.env.PORT || 5000
connectDB()

if (!process.env.JWT_SECRET) {
    console.warn("WARNING: JWT_SECRET environment variable is missing. Using fallback secret.");
    process.env.JWT_SECRET = 'supersecretjwtsecretkey';
}

// Middlewares
app.use(express.json())
app.use(cors())

// API Endpoints
app.use('/api/user', userRouter)
app.use('/api/doctor', doctorRouter)
app.use('/api/admin', adminRouter)

app.get('/', (req, res) => {
    res.send('API WORKING')
})

app.listen(port, () => console.log(`Server started on PORT : ${port}`))
