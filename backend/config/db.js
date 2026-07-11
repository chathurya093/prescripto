import mongoose from "mongoose";
import { MongoMemoryServer } from 'mongodb-memory-server';
import doctorModel from '../models/doctorModel.js';
import userModel from '../models/userModel.js';
import appointmentModel from '../models/appointmentModel.js';
import bcrypt from 'bcrypt';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongoServer;

const connectDB = async () => {
    mongoose.connection.on('connected', () => console.log("Database Connected"))
    
    let uri = process.env.MONGODB_URI;
    if (!uri) {
        console.log("No MONGODB_URI found. Starting MongoMemoryServer...")
        try {
            const dbPath = path.resolve(__dirname, '../db_persistent');
            if (!fs.existsSync(dbPath)) {
                fs.mkdirSync(dbPath, { recursive: true });
            }
            try {
                mongoServer = await MongoMemoryServer.create({
                    instance: {
                        dbPath: dbPath,
                        storageEngine: 'wiredTiger',
                    }
                });
                console.log(`MongoMemoryServer started with persistent storage at: ${mongoServer.getUri()}`);
            } catch (persistErr) {
                console.warn("Failed to start MongoMemoryServer with persistent storage. Starting in pure in-memory mode...", persistErr.message);
                mongoServer = await MongoMemoryServer.create();
                console.log(`MongoMemoryServer started in-memory at: ${mongoServer.getUri()}`);
            }
            uri = mongoServer.getUri();
        } catch (err) {
            console.error("Failed to start MongoMemoryServer in any mode:", err);
            // fallback to local uri
            uri = 'mongodb://127.0.0.1:27017/prescripto';
        }
    }
    
    try {
        mongoose.set('bufferCommands', false);
        await mongoose.connect(uri)
        
        // Auto-seed if it's the in-memory database and empty
        if (!process.env.MONGODB_URI) {
            const count = await doctorModel.countDocuments();
            if (count === 0) {
                console.log("Database is empty. Auto-seeding doctors, user, and appointments...");
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash('password123', salt);
                const doctors = [
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4561',
                        name: 'Dr. Richard James',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc1.png',
                        speciality: 'General physician',
                        degree: 'MBBS',
                        experience: '4 Years',
                        about: 'Dr. Richard has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 50,
                        address: {
                            line1: '17th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    },
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4562',
                        name: 'Dr. Emily Larson',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc2.png',
                        speciality: 'Gynecologist',
                        degree: 'MBBS',
                        experience: '3 Years',
                        about: 'Dr. Emily has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 60,
                        address: {
                            line1: '27th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    },
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4563',
                        name: 'Dr. Sarah Patel',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc3.png',
                        speciality: 'Dermatologist',
                        degree: 'MBBS',
                        experience: '1 Years',
                        about: 'Dr. Sarah has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 30,
                        address: {
                            line1: '37th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    },
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4564',
                        name: 'Dr. Christopher Lee',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc4.png',
                        speciality: 'Pediatricians',
                        degree: 'MBBS',
                        experience: '2 Years',
                        about: 'Dr. Christopher has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 40,
                        address: {
                            line1: '47th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    },
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4565',
                        name: 'Dr. Timothy White',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc5.png',
                        speciality: 'Neurologist',
                        degree: 'MBBS',
                        experience: '4 Years',
                        about: 'Dr. Timothy has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 50,
                        address: {
                            line1: '57th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    },
                    {
                        _id: '65c1f5e8f1d8c12a4b8b4566',
                        name: 'Dr. Andrew Williams',
                        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc6.png',
                        speciality: 'Gastroenterologist',
                        degree: 'MBBS',
                        experience: '4 Years',
                        about: 'Dr. Andrew has a strong commitment to delivering comprehensive medical care, focusing on preventive medicine, early diagnosis, and effective treatment strategies.',
                        fees: 50,
                        address: {
                            line1: '57th Cross, Richmond',
                            line2: 'Circle, Ring Road, London'
                        },
                        date: Date.now(),
                        slots_booked: {}
                    }
                ];
                const doctorData = doctors.map(doc => ({ ...doc, email: `${doc.name.replace(/\s+/g, '').toLowerCase()}@test.com`, password: hashedPassword }));
                await doctorModel.insertMany(doctorData);
                console.log("Database auto-seeded successfully with Doctors!");

                // Seed mock user
                const mockUser = {
                    _id: '65c1f5e8f1d8c12a4b8b4569',
                    name: 'John Doe',
                    email: 'johndoe@example.com',
                    password: hashedPassword,
                    image: 'https://raw.githubusercontent.com/arjungreatstack/prescripto-assets/main/assets_frontend/upload_area.png',
                    address: { line1: '123 Main St', line2: 'Apt 4B' },
                    gender: 'Male',
                    dob: '1995-05-15',
                    phone: '1234567890'
                };
                await userModel.create(mockUser);
                console.log("Database auto-seeded successfully with mock user John Doe!");

                // Seed mock appointment
                const mockAppointments = [
                    {
                        userId: '65c1f5e8f1d8c12a4b8b4569',
                        docId: '65c1f5e8f1d8c12a4b8b4561', // Dr. Richard James
                        slotDate: '15_07_2026',
                        slotTime: '10:00 AM',
                        userData: {
                            name: 'John Doe',
                            image: 'https://raw.githubusercontent.com/arjungreatstack/prescripto-assets/main/assets_frontend/upload_area.png',
                            dob: '1995-05-15'
                        },
                        docData: {
                            name: 'Dr. Richard James',
                            speciality: 'General physician',
                            fees: 50
                        },
                        amount: 50,
                        date: Date.now(),
                        cancelled: false,
                        payment: false,
                        isCompleted: false
                    }
                ];
                await appointmentModel.insertMany(mockAppointments);
                console.log("Database auto-seeded successfully with mock appointment!");
            }
        }

        // Migrate existing doctors if they have plain-text passwords
        const doctorsToFix = await doctorModel.find({ password: 'password123' });
        if (doctorsToFix.length > 0) {
            console.log(`Found ${doctorsToFix.length} doctors with plain-text passwords. Hashing them...`);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            for (const doc of doctorsToFix) {
                doc.password = hashedPassword;
                await doc.save();
            }
            console.log("Passwords hashed successfully!");
        }

        // Ensure mock user exists in persistent DB if it's already created but empty of users
        const userCount = await userModel.countDocuments();
        if (userCount === 0) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash('password123', salt);
            const mockUser = {
                _id: '65c1f5e8f1d8c12a4b8b4569',
                name: 'John Doe',
                email: 'johndoe@example.com',
                password: hashedPassword,
                image: 'https://raw.githubusercontent.com/arjungreatstack/prescripto-assets/main/assets_frontend/upload_area.png',
                address: { line1: '123 Main St', line2: 'Apt 4B' },
                gender: 'Male',
                dob: '1995-05-15',
                phone: '1234567890'
            };
            await userModel.create(mockUser);
            console.log("Created mock user John Doe.");
        }

        // Ensure mock appointment exists in persistent DB if it's empty
        const appointmentCount = await appointmentModel.countDocuments();
        if (appointmentCount === 0) {
            const mockAppointments = [
                {
                    userId: '65c1f5e8f1d8c12a4b8b4569',
                    docId: '65c1f5e8f1d8c12a4b8b4561', // Dr. Richard James
                    slotDate: '15_07_2026',
                    slotTime: '10:00 AM',
                    userData: {
                        name: 'John Doe',
                        image: 'https://raw.githubusercontent.com/arjungreatstack/prescripto-assets/main/assets_frontend/upload_area.png',
                        dob: '1995-05-15'
                    },
                    docData: {
                        name: 'Dr. Richard James',
                        speciality: 'General physician',
                        fees: 50
                    },
                    amount: 50,
                    date: Date.now(),
                    cancelled: false,
                    payment: false,
                    isCompleted: false
                }
            ];
            await appointmentModel.insertMany(mockAppointments);
            console.log("Created mock appointment for Dr. Richard James.");
        }
    } catch (error) {
        console.error("Database connection error:", error)
    }
}

export default connectDB
