import userModel from "../models/userModel.js";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v2 as cloudinary } from "cloudinary";

// API to register user
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Enter a valid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Enter a strong password" });
        }

        // Hashing user password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const userData = {
            name,
            email,
            password: hashedPassword
        };

        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to login user
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            res.json({ success: true, token });
        } else {
            res.json({ success: false, message: "Invalid credentials" });
        }
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to get user profile data
const getProfile = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const userData = await userModel.findById(userId).select('-password');
        if (!userData) {
            return res.json({ success: false, message: "User not found" });
        }
        res.json({ success: true, userData });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

// API to update user profile data
const updateProfile = async (req, res) => {
    try {
        const userId = req.userId || req.body.userId;
        const { name, phone, address, gender, dob } = req.body;
        const imageFile = req.file;

        console.log("Update Profile Request - Body:", req.body);
        console.log("Update Profile Request - File:", imageFile);
        console.log("Update Profile Request - Decoded User ID:", userId);

        if (!name || !phone || !gender || !dob) {
            return res.json({ success: false, message: "Missing Details" });
        }

        const userExists = await userModel.findById(userId);
        if (!userExists) {
            return res.json({ success: false, message: "User not found" });
        }

        let addressData;
        if (typeof address === 'string') {
            try {
                addressData = JSON.parse(address);
            } catch (e) {
                addressData = address;
            }
        } else {
            addressData = address;
        }

        const updateData = {
            name,
            phone,
            address: addressData,
            gender,
            dob
        };

        if (imageFile) {
            if (process.env.CLOUDINARY_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_SECRET_KEY) {
                cloudinary.config({
                    cloud_name: process.env.CLOUDINARY_NAME,
                    api_key: process.env.CLOUDINARY_API_KEY,
                    api_secret: process.env.CLOUDINARY_SECRET_KEY
                });
                const imageUpload = await cloudinary.uploader.upload(imageFile.path, { resource_type: 'image' });
                updateData.image = imageUpload.secure_url;
            } else {
                console.log("Cloudinary not configured. Skipping image upload, using default/existing.");
            }
        }

        await userModel.findByIdAndUpdate(userId, updateData);
        res.json({ success: true, message: "Profile Updated" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
}

export { registerUser, loginUser, getProfile, updateProfile };
