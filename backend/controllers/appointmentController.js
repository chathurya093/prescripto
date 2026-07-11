import appointmentModel from "../models/appointmentModel.js"
import doctorModel from "../models/doctorModel.js"
import userModel from "../models/userModel.js"

// API to book appointment
const bookAppointment = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId
        const { docId, slotDate, slotTime } = req.body

        console.log("Book Appointment - Body:", req.body);
        console.log("Book Appointment - Decoded User ID:", userId);

        const docData = await doctorModel.findById(docId).select('-password')
        if (!docData) {
            console.log("Book Appointment - Doctor not found in database for ID:", docId);
            return res.json({ success: false, message: 'Doctor not found' })
        }
        if (!docData.available) {
            return res.json({ success: false, message: 'Doctor not available' })
        }

        let slots_booked = docData.slots_booked
        if (slots_booked[slotDate]) {
            if (slots_booked[slotDate].includes(slotTime)) {
                return res.json({ success: false, message: 'Slot not available' })
            } else {
                slots_booked[slotDate].push(slotTime)
            }
        } else {
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password')
        if (!userData) {
            return res.json({ success: false, message: 'User not found' })
        }

        const docDataObj = docData.toObject()
        delete docDataObj.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData: userData.toObject(),
            docData: docDataObj,
            amount: docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData)
        await newAppointment.save()

        // Update doctor slots_booked
        await doctorModel.findByIdAndUpdate(docId, { slots_booked })
        
        res.json({ success: true, message: 'Appointment Booked' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to get user appointments
const listAppointment = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId
        const appointments = await appointmentModel.find({ userId })
        res.json({ success: true, appointments })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

// API to cancel appointment
const cancelAppointment = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId
        const { appointmentId } = req.body
        const appointmentData = await appointmentModel.findById(appointmentId)

        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true })
        
        // Remove slot from doctor data
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

// API to make payment of appointment online
const paymentOnline = async (req, res) => {
    try {
        const { appointmentId } = req.body
        const userId = req.userId || req.body.userId

        const appointmentData = await appointmentModel.findById(appointmentId)
        if (!appointmentData) {
            return res.json({ success: false, message: 'Appointment not found' })
        }
        if (appointmentData.userId !== userId) {
            return res.json({ success: false, message: 'Unauthorized action' })
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true })
        res.json({ success: true, message: 'Payment Successful' })
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export { bookAppointment, listAppointment, cancelAppointment, paymentOnline }
