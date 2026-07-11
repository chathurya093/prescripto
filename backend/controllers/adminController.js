import validator from 'validator'
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from 'cloudinary'
import jwt from 'jsonwebtoken'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import userModel from '../models/userModel.js'

// API for admin login
const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body
        console.log("Admin Login Request - Body:", req.body);

        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
        const jwtSecret = process.env.JWT_SECRET || 'supersecretjwtsecretkey'

        if (email === adminEmail && password === adminPassword) {
            const token = jwt.sign(email + password, jwtSecret)
            res.json({ success: true, token })
        } else {
            res.json({ success: false, message: 'Invalid credentials' })
        }
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to add doctor
const addDoctor = async (req, res) => {
    try {
        const { name, email, password, speciality, degree, experience, about, fees, address } = req.body
        const imageFile = req.file

        if (!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address) {
            return res.json({ success: false, message: 'Missing Details' })
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: 'Please enter a valid email' })
        }

        // Validate password strength
        if (password.length < 8) {
            return res.json({ success: false, message: 'Please enter a strong password (min 8 characters)' })
        }

        // Checking if doctor already exists
        const exists = await doctorModel.findOne({ email })
        if (exists) {
            return res.json({ success: false, message: 'Doctor already exists with this email' })
        }

        // Hash doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // Upload image to Cloudinary if configured
        let imageUrl = 'https://raw.githubusercontent.com/arjungreatstack/prescripto-assets/main/assets_frontend/doc1.png'
        if (imageFile) {
            if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY) {
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_SECRET_KEY
                })
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' })
                imageUrl = imageUpload.secure_url
            } else {
                console.log("Cloudinary not configured. Skipping image upload, using default placeholder doctor image.")
            }
        }

        // Parse address
        let addressData
        try {
            addressData = JSON.parse(address)
        } catch (error) {
            addressData = address
        }

        const doctorData = {
            name,
            email,
            password: hashedPassword,
            image: imageUrl,
            speciality,
            degree,
            experience,
            about,
            fees: Number(fees),
            address: addressData,
            date: Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({ success: true, message: 'Doctor Added Successfully' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all appointments list for admin
const appointmentsAdmin = async (req, res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment by admin
const appointmentCancel = async (req, res) => {
    try {
        const { appointmentId } = req.body

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })

        // Release doctor slot
        const { docId, slotDate, slotTime } = appointmentData
        const doctorData = await doctorModel.findById(docId)

        let slots_booked = doctorData.slots_booked
        slots_booked[slotDate] = slots_booked[slotDate].filter(e => e !== slotTime)

        await doctorModel.findByIdAndUpdate(docId, { slots_booked })

        res.json({ success: true, message: 'Appointment Cancelled' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get dashboard data for admin panel
const adminDashboard = async (req, res) => {
    try {
        const doctors = await doctorModel.find({})
        const users = await userModel.find({})
        const appointments = await appointmentModel.find({})

        const dashData = {
            doctors: doctors.length,
            appointments: appointments.length,
            patients: users.length,
            latestAppointments: appointments.reverse().slice(0, 5)
        }

        res.json({ success: true, dashData })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get all doctors list for admin panel
const allDoctors = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({ success: true, doctors })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { loginAdmin, addDoctor, appointmentsAdmin, appointmentCancel, adminDashboard, allDoctors }
