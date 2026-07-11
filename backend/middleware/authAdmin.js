import jwt from 'jsonwebtoken'

// admin authentication middleware
const authAdmin = async (req, res, next) => {
    try {
        const { atoken } = req.headers
        if (!atoken) {
            return res.json({ success: false, message: 'Not Authorized. Login Again.' })
        }
        
        const decoded = jwt.verify(atoken, process.env.JWT_SECRET)
        
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com'
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123'
        
        // The token is generated as adminEmail + adminPassword
        if (decoded !== adminEmail + adminPassword) {
            return res.json({ success: false, message: 'Not Authorized. Login Again.' })
        }
        
        next()
    } catch (error) {
        console.log(error)
        res.json({ success: false, message: error.message })
    }
}

export default authAdmin
