import mongoose from 'mongoose';
import 'dotenv/config';
import connectDB from './config/db.js';
import doctorModel from './models/doctorModel.js';
import bcrypt from 'bcrypt';

const doctors = [
    {
        name: 'Dr. Richard James',
        image: 'https://res.cloudinary.com/prescripto/image/upload/v1700000000/doc1.png', // Fallback URL if we need real CDNs later, currently front-end relies on local image matched by _id, but we'll adapt.
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

const seedDB = async () => {
    try {
        await connectDB();
        await doctorModel.deleteMany({});
        
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('password123', salt);
        // Use a generic placeholder password since we just want to fetch them via API
        const doctorData = doctors.map(doc => ({ ...doc, email: `${doc.name.replace(/\s+/g, '').toLowerCase()}@test.com`, password: hashedPassword }));
        
        await doctorModel.insertMany(doctorData);
        console.log("Database seeded successfully with Doctors!");
        process.exit();
    } catch (error) {
        console.error("Error with seeding:", error);
        process.exit(1);
    }
};

seedDB();
