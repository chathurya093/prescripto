import express from 'express'
import { addDoctor, loginAdmin, appointmentsAdmin, appointmentCancel, adminDashboard, allDoctors } from '../controllers/adminController.js'
import { changeAvailability } from '../controllers/doctorController.js'
import upload from '../middleware/multer.js'
import authAdmin from '../middleware/authAdmin.js'

const adminRouter = express.Router()

adminRouter.post('/login', loginAdmin)
adminRouter.post('/add-doctor', authAdmin, upload.single('image'), addDoctor)
adminRouter.post('/change-availability', authAdmin, changeAvailability)
adminRouter.get('/appointments', authAdmin, appointmentsAdmin)
adminRouter.post('/cancel-appointment', authAdmin, appointmentCancel)
adminRouter.get('/dashboard', authAdmin, adminDashboard)
adminRouter.get('/all-doctors', authAdmin, allDoctors)

export default adminRouter
