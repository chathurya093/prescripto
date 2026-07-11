import React, { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import { assets } from '../assets/assets'
import axios from 'axios'
import { toast } from 'react-toastify'

const MyProfile = () => {
    const { userData, setUserData, token, backendUrl, loadUserProfileData } = useContext(AppContext)
    const navigate = useNavigate()
    
    const [isEdit, setIsEdit] = useState(false)
    const [image, setImage] = useState(false)
    const [localData, setLocalData] = useState(null)

    // Route Protection
    useEffect(() => {
        if (!token) {
            navigate('/login')
        }
    }, [token, navigate])

    // Copy userData to localData when userData changes
    useEffect(() => {
        if (userData) {
            setLocalData({ ...userData })
        }
    }, [userData])

    if (!token) {
        return null
    }

    if (!userData || !localData) {
        return (
            <div className='min-h-[60vh] flex items-center justify-center'>
                <div className='flex flex-col items-center gap-2'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
                    <p className='text-zinc-500 font-medium animate-pulse'>Loading profile details...</p>
                </div>
            </div>
        )
    }

    const updateUserProfileData = async () => {
        try {
            const formData = new FormData()
            formData.append('name', localData.name)
            formData.append('phone', localData.phone)
            formData.append('address', JSON.stringify(localData.address || { line1: '', line2: '' }))
            formData.append('gender', localData.gender)
            formData.append('dob', localData.dob)

            if (image) {
                formData.append('image', image)
            }

            const { data } = await axios.post(backendUrl + '/api/user/update-profile', formData, { headers: { token } })
            if (data.success) {
                toast.success(data.message)
                await loadUserProfileData()
                setIsEdit(false)
                setImage(false)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
        }
    }

    const handleCancel = () => {
        setLocalData({ ...userData })
        setImage(false)
        setIsEdit(false)
    }

    return (
        <div className='max-w-2xl mx-auto my-10 px-4'>
            <div className='bg-white rounded-2xl border border-zinc-100 shadow-xl overflow-hidden transition-all duration-300 hover:shadow-2xl'>
                
                {/* Header Profile Hero Card */}
                <div className='relative h-32 bg-gradient-to-r from-primary/80 to-primary/40 flex items-center px-8'>
                    <h2 className='text-white text-2xl font-bold tracking-wide mt-6'>My Profile</h2>
                </div>

                <div className='px-8 pb-8 relative'>
                    
                    {/* Profile Picture Overlay Grid */}
                    <div className='flex flex-col sm:flex-row items-center sm:items-end gap-6 -mt-16 mb-8'>
                        <div className='relative w-32 h-32 rounded-2xl overflow-hidden border-4 border-white shadow-lg bg-zinc-100 group'>
                            {isEdit ? (
                                <label htmlFor="image" className='cursor-pointer w-full h-full block relative'>
                                    <img className="w-full h-full object-cover opacity-75 group-hover:opacity-60 transition-all" src={image ? URL.createObjectURL(image) : (localData.image || assets.profile_pic)} alt="" />
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <img className="w-8 filter invert" src={assets.upload_icon} alt="" />
                                    </div>
                                    <input onChange={(e) => setImage(e.target.files[0])} type="file" id="image" hidden />
                                </label>
                            ) : (
                                <img className="w-full h-full object-cover" src={localData.image || assets.profile_pic} alt="" />
                            )}
                        </div>

                        <div className='text-center sm:text-left flex-1'>
                            {isEdit ? (
                                <input 
                                    className='bg-zinc-50 border border-zinc-200 text-2xl font-bold px-3 py-1.5 rounded-lg text-zinc-800 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                    type="text" 
                                    value={localData.name} 
                                    onChange={e => setLocalData(prev => ({ ...prev, name: e.target.value }))} 
                                />
                            ) : (
                                <h1 className='text-3xl font-bold text-zinc-800'>{localData.name}</h1>
                            )}
                            <p className='text-zinc-500 text-sm mt-1'>Patient Profile ID: #{localData._id?.slice(-8)}</p>
                        </div>
                    </div>

                    <div className='space-y-8'>
                        {/* Section: Contact Details */}
                        <div className='bg-zinc-50/50 rounded-xl p-6 border border-zinc-100'>
                            <div className='flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Zm6-10.125a1.875 1.875 0 1 1-3.75 0 1.875 1.875 0 0 1 3.75 0Zm1.294 6.336a6.721 6.721 0 0 1-3.17.789 6.721 6.721 0 0 1-3.168-.789 3.376 3.376 0 0 1 6.338 0Z" />
                                </svg>
                                <h3 className='font-semibold text-zinc-800 text-base'>Contact Information</h3>
                            </div>
                            
                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-zinc-700'>
                                <div className='space-y-1'>
                                    <span className='text-zinc-400 font-medium text-xs uppercase tracking-wider'>Email Address</span>
                                    <p className='text-zinc-800 font-medium break-all'>{localData.email}</p>
                                </div>

                                <div className='space-y-1'>
                                    <span className='text-zinc-400 font-medium text-xs uppercase tracking-wider'>Phone Number</span>
                                    {isEdit ? (
                                        <input 
                                            className='bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-800 w-full focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                            type="text" 
                                            value={localData.phone} 
                                            onChange={e => setLocalData(prev => ({ ...prev, phone: e.target.value }))} 
                                        />
                                    ) : (
                                        <p className='text-zinc-800 font-medium'>{localData.phone || 'Not Provided'}</p>
                                    )}
                                </div>

                                <div className='sm:col-span-2 space-y-1'>
                                    <span className='text-zinc-400 font-medium text-xs uppercase tracking-wider'>Residential Address</span>
                                    {isEdit ? (
                                        <div className='space-y-2 mt-1'>
                                            <input 
                                                className='bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-800 w-full focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                                onChange={e => setLocalData(prev => ({ ...prev, address: { ...(prev.address || {}), line1: e.target.value } }))} 
                                                value={localData.address?.line1 || ''} 
                                                placeholder="Address Line 1"
                                                type="text" 
                                            />
                                            <input 
                                                className='bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-800 w-full focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                                onChange={e => setLocalData(prev => ({ ...prev, address: { ...(prev.address || {}), line2: e.target.value } }))} 
                                                value={localData.address?.line2 || ''} 
                                                placeholder="Address Line 2"
                                                type="text" 
                                            />
                                        </div>
                                    ) : (
                                        <p className='text-zinc-800 font-medium leading-relaxed'>
                                            {localData.address?.line1 || ''}
                                            {localData.address?.line2 && <><br />{localData.address.line2}</>}
                                            {(!localData.address?.line1 && !localData.address?.line2) && 'Not Provided'}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section: Basic Details */}
                        <div className='bg-zinc-50/50 rounded-xl p-6 border border-zinc-100'>
                            <div className='flex items-center gap-2 mb-4 pb-2 border-b border-zinc-100'>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-primary">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                </svg>
                                <h3 className='font-semibold text-zinc-800 text-base'>Basic Information</h3>
                            </div>

                            <div className='grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm text-zinc-700'>
                                <div className='space-y-1'>
                                    <span className='text-zinc-400 font-medium text-xs uppercase tracking-wider'>Gender</span>
                                    {isEdit ? (
                                        <select 
                                            className='bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-800 w-full focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                            value={localData.gender} 
                                            onChange={e => setLocalData(prev => ({ ...prev, gender: e.target.value }))}
                                        >
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                            <option value="Not Selected">Not Selected</option>
                                        </select>
                                    ) : (
                                        <p className='text-zinc-800 font-medium'>{localData.gender}</p>
                                    )}
                                </div>

                                <div className='space-y-1'>
                                    <span className='text-zinc-400 font-medium text-xs uppercase tracking-wider'>Date of Birth</span>
                                    {isEdit ? (
                                        <input 
                                            className='bg-white border border-zinc-200 px-3 py-1.5 rounded-lg text-zinc-800 w-full focus:outline-none focus:ring-2 focus:ring-primary/40' 
                                            type='date' 
                                            value={localData.dob} 
                                            onChange={e => setLocalData(prev => ({ ...prev, dob: e.target.value }))} 
                                        />
                                    ) : (
                                        <p className='text-zinc-800 font-medium'>{localData.dob === 'Not Selected' ? 'Not Selected' : new Date(localData.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className='mt-8 pt-6 border-t border-zinc-100 flex items-center justify-end gap-3'>
                        {isEdit ? (
                            <>
                                <button 
                                    className='px-6 py-2.5 rounded-xl border border-zinc-200 text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 transition-all font-medium text-sm' 
                                    onClick={handleCancel}
                                >
                                    Cancel
                                </button>
                                <button 
                                    className='px-6 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/95 active:scale-98 transition-all font-medium text-sm shadow-md shadow-primary/20' 
                                    onClick={updateUserProfileData}
                                >
                                    Save Changes
                                </button>
                            </>
                        ) : (
                            <button 
                                className='px-6 py-2.5 rounded-xl border-2 border-primary text-primary hover:bg-primary hover:text-white active:scale-98 transition-all font-medium text-sm shadow-sm' 
                                onClick={() => setIsEdit(true)}
                            >
                                Edit Profile
                            </button>
                        )}
                    </div>

                </div>
            </div>
        </div>
    )
}

export default MyProfile
