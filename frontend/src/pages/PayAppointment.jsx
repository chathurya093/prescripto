import React, { useState, useEffect, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { AppContext } from '../context/AppContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const PayAppointment = () => {
    const { appointmentId } = useParams()
    const navigate = useNavigate()
    const { backendUrl, token } = useContext(AppContext)

    const [appointment, setAppointment] = useState(null)
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('card') // card, upi, netbanking
    
    // Card details state
    const [cardNumber, setCardNumber] = useState('')
    const [cardExpiry, setCardExpiry] = useState('')
    const [cardCvv, setCardCvv] = useState('')
    const [cardName, setCardName] = useState('')
    const [focusedField, setFocusedField] = useState('')

    // Payment Processing State
    const [paymentStatus, setPaymentStatus] = useState('idle') // idle, processing, success
    const [processingStep, setProcessingStep] = useState(0)

    const steps = [
        'Securing end-to-end encrypted connection...',
        'Validating transaction details with billing server...',
        'Requesting authorization from bank gateway...',
        'Processing transaction charge...',
        'Finalizing secure payment registration...'
    ]

    // Route protection and fetch data
    useEffect(() => {
        if (!token) {
            navigate('/login')
            return
        }

        const fetchAppointment = async () => {
            try {
                const { data } = await axios.get(backendUrl + '/api/user/appointments', { headers: { token } })
                if (data.success) {
                    const found = data.appointments.find(app => app._id === appointmentId)
                    setAppointment(found || null)
                } else {
                    toast.error(data.message)
                }
            } catch (error) {
                console.log(error)
                toast.error(error.message)
            } finally {
                setLoading(false)
            }
        }

        fetchAppointment()
    }, [token, appointmentId, backendUrl, navigate])

    // Step progression during processing
    useEffect(() => {
        if (paymentStatus !== 'processing') return

        const timer = setInterval(() => {
            setProcessingStep(prev => {
                if (prev < steps.length - 1) {
                    return prev + 1
                } else {
                    clearInterval(timer)
                    finalizePayment()
                    return prev
                }
            })
        }, 1200)

        return () => clearInterval(timer)
    }, [paymentStatus])

    const finalizePayment = async () => {
        try {
            const { data } = await axios.post(backendUrl + '/api/user/payment-online', { appointmentId }, { headers: { token } })
            if (data.success) {
                setPaymentStatus('success')
                setTimeout(() => {
                    toast.success('Payment completed successfully!')
                    navigate('/my-appointments')
                }, 2000)
            } else {
                toast.error(data.message)
                setPaymentStatus('idle')
            }
        } catch (error) {
            console.log(error)
            toast.error(error.message)
            setPaymentStatus('idle')
        }
    }

    const handlePaySubmit = (e) => {
        e.preventDefault()
        setProcessingStep(0)
        setPaymentStatus('processing')
    }

    // Format Card Number with space every 4 digits
    const handleCardNumberChange = (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        let matches = val.match(/\d{4,16}/g)
        let match = (matches && matches[0]) || ''
        let parts = []

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4))
        }

        if (parts.length > 0) {
            setCardNumber(parts.join(' '))
        } else {
            setCardNumber(val)
        }
    }

    // Format Expiry as MM/YY
    const handleExpiryChange = (e) => {
        let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
        if (val.length >= 2) {
            setCardExpiry(val.substring(0, 2) + '/' + val.substring(2, 4))
        } else {
            setCardExpiry(val)
        }
    }

    // Detect Card Type (Visa / Mastercard / Amex)
    const getCardType = () => {
        const cleanNumber = cardNumber.replace(/\s/g, '')
        if (cleanNumber.startsWith('4')) return 'Visa'
        if (cleanNumber.startsWith('5')) return 'Mastercard'
        if (cleanNumber.startsWith('3')) return 'American Express'
        return 'Card'
    }

    if (loading) {
        return (
            <div className='min-h-[60vh] flex items-center justify-center'>
                <div className='flex flex-col items-center gap-2'>
                    <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary'></div>
                    <p className='text-zinc-500 font-medium animate-pulse'>Initializing secure gateway...</p>
                </div>
            </div>
        )
    }

    if (!appointment) {
        return (
            <div className='min-h-[60vh] flex flex-col items-center justify-center text-center px-4'>
                <div className='bg-red-50 p-4 rounded-full text-red-500 mb-4'>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                    </svg>
                </div>
                <h2 className='text-2xl font-bold text-gray-800 mb-2'>Appointment Not Found</h2>
                <p className='text-gray-600 max-w-sm mb-6'>The appointment you are trying to pay for is invalid or cannot be loaded.</p>
                <button onClick={() => navigate('/my-appointments')} className='bg-primary text-white px-8 py-2.5 rounded-xl font-medium text-sm transition-all active:scale-98 shadow-md shadow-primary/20'>Go Back</button>
            </div>
        )
    }

    return (
        <div className='max-w-4xl mx-auto my-10 px-4 min-h-[70vh]'>
            
            {/* Full screen loader step overlays */}
            {paymentStatus === 'processing' && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4 text-center'>
                    <div className='bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl border border-zinc-100 flex flex-col items-center gap-6 animate-scale-in'>
                        <div className='relative w-20 h-20 flex items-center justify-center bg-primary/10 rounded-full text-primary animate-pulse'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 animate-bounce">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                            </svg>
                        </div>
                        <div className='space-y-2'>
                            <h3 className='text-xl font-bold text-zinc-800'>Processing Payment</h3>
                            <p className='text-zinc-400 text-xs uppercase tracking-wider font-semibold animate-pulse'>Secure Checkout Session</p>
                        </div>
                        <div className='w-full bg-zinc-100 h-1.5 rounded-full overflow-hidden'>
                            <div className='bg-primary h-full transition-all duration-700 ease-out' style={{ width: `${((processingStep + 1) / steps.length) * 100}%` }}></div>
                        </div>
                        <p className='text-sm text-zinc-600 font-medium h-12 flex items-center justify-center px-4 transition-all duration-300'>{steps[processingStep]}</p>
                        <p className='text-[10px] text-zinc-400'>Please do not refresh the page or click back.</p>
                    </div>
                </div>
            )}

            {/* Success animations */}
            {paymentStatus === 'success' && (
                <div className='fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center px-4 text-center'>
                    <div className='bg-white max-w-md w-full p-8 rounded-2xl shadow-2xl border border-zinc-100 flex flex-col items-center gap-6 animate-scale-in'>
                        <div className='w-20 h-20 flex items-center justify-center bg-green-100 rounded-full text-green-500 shadow-md shadow-green-100/50'>
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-12 h-12 animate-scale-up">
                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                            </svg>
                        </div>
                        <div className='space-y-1'>
                            <h3 className='text-2xl font-bold text-zinc-800'>Payment Completed!</h3>
                            <p className='text-zinc-500 font-medium text-sm'>Your transaction was authorized successfully.</p>
                        </div>
                        <p className='text-xs text-zinc-400 animate-pulse'>Redirecting back to dashboard...</p>
                    </div>
                </div>
            )}

            <div className='grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8'>
                
                {/* Checkout Fields Section */}
                <div className='bg-white rounded-2xl border border-zinc-100 shadow-xl p-6 sm:p-8 flex flex-col justify-between'>
                    <div>
                        <div className='pb-4 border-b border-zinc-100 mb-6'>
                            <h2 className='text-xl font-bold text-zinc-800'>Select Payment Method</h2>
                            <p className='text-zinc-400 text-xs mt-1'>Choose how you want to settle the payment amount securely.</p>
                        </div>

                        {/* Navigation Tabs */}
                        <div className='flex gap-2 p-1.5 bg-zinc-50 rounded-xl border border-zinc-100 mb-8'>
                            <button 
                                onClick={() => setActiveTab('card')}
                                className={`flex-1 py-2.5 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'card' ? 'bg-white text-primary shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z" />
                                </svg>
                                Credit / Debit Card
                            </button>
                            <button 
                                onClick={() => setActiveTab('upi')}
                                className={`flex-1 py-2.5 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'upi' ? 'bg-white text-primary shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                                </svg>
                                UPI / Scan QR
                            </button>
                            <button 
                                onClick={() => setActiveTab('netbanking')}
                                className={`flex-1 py-2.5 rounded-lg font-semibold text-xs tracking-wide uppercase transition-all flex items-center justify-center gap-2 ${activeTab === 'netbanking' ? 'bg-white text-primary shadow-sm border border-zinc-100' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.5h-15V21m-1.5 0h18" />
                                </svg>
                                Net Banking
                            </button>
                        </div>

                        {/* Tab Content 1: Credit Card Form */}
                        {activeTab === 'card' && (
                            <form onSubmit={handlePaySubmit} className='space-y-5 animate-fade-in'>
                                
                                {/* Realistic card render component */}
                                <div className='relative w-full aspect-[1.6/1] max-w-sm mx-auto bg-gradient-to-br from-zinc-800 to-zinc-950 rounded-2xl p-6 text-white shadow-xl overflow-hidden border border-zinc-700/50 mb-8 select-none transition-all hover:scale-[1.02]'>
                                    <div className='absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_60%)]'></div>
                                    <div className='flex justify-between items-start mb-6'>
                                        <div className='flex flex-col gap-1'>
                                            <span className='text-[10px] uppercase tracking-widest text-zinc-400'>SECURE PLATINUM</span>
                                            <div className='w-12 h-8 bg-zinc-800 rounded-md border border-zinc-700 flex items-center justify-center overflow-hidden'>
                                                <div className='w-8 h-6 bg-yellow-600/80 rounded-sm relative flex items-center justify-center'>
                                                    <div className='absolute inset-x-0 h-[1px] bg-zinc-900/30'></div>
                                                    <div className='absolute inset-y-0 w-[1px] bg-zinc-900/30'></div>
                                                </div>
                                            </div>
                                        </div>
                                        <span className='text-sm italic font-bold tracking-wider'>{getCardType()}</span>
                                    </div>
                                    
                                    <div className='space-y-4 mt-6'>
                                        <div className={`text-xl sm:text-2xl font-mono tracking-widest text-center transition-all ${focusedField === 'number' ? 'text-primary scale-[1.01]' : 'text-zinc-100'}`}>
                                            {cardNumber || '•••• •••• •••• ••••'}
                                        </div>
                                        
                                        <div className='flex justify-between items-end pt-4'>
                                            <div className='space-y-0.5'>
                                                <span className='text-[8px] uppercase tracking-wider text-zinc-500'>Card Holder</span>
                                                <p className={`text-xs font-mono tracking-wide uppercase truncate max-w-[200px] ${focusedField === 'name' ? 'text-primary' : 'text-zinc-300'}`}>
                                                    {cardName || 'YOUR FULL NAME'}
                                                </p>
                                            </div>
                                            <div className='flex gap-4'>
                                                <div className='space-y-0.5 text-right'>
                                                    <span className='text-[8px] uppercase tracking-wider text-zinc-500'>Expires</span>
                                                    <p className={`text-xs font-mono ${focusedField === 'expiry' ? 'text-primary' : 'text-zinc-300'}`}>
                                                        {cardExpiry || 'MM/YY'}
                                                    </p>
                                                </div>
                                                <div className='space-y-0.5 text-right'>
                                                    <span className='text-[8px] uppercase tracking-wider text-zinc-500'>CVV</span>
                                                    <p className={`text-xs font-mono ${focusedField === 'cvv' ? 'text-primary' : 'text-zinc-300'}`}>
                                                        {cardCvv || '•••'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className='space-y-4'>
                                    <div className='space-y-1.5'>
                                        <label className='text-zinc-500 text-xs font-semibold uppercase tracking-wider'>Cardholder Name</label>
                                        <input 
                                            required
                                            type="text" 
                                            value={cardName}
                                            onFocus={() => setFocusedField('name')}
                                            onBlur={() => setFocusedField('')}
                                            onChange={(e) => setCardName(e.target.value)}
                                            placeholder='e.g. John Doe'
                                            className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50'
                                        />
                                    </div>

                                    <div className='space-y-1.5'>
                                        <label className='text-zinc-500 text-xs font-semibold uppercase tracking-wider'>Card Number</label>
                                        <input 
                                            required
                                            type="text" 
                                            maxLength="19"
                                            value={cardNumber}
                                            onFocus={() => setFocusedField('number')}
                                            onBlur={() => setFocusedField('')}
                                            onChange={handleCardNumberChange}
                                            placeholder='4000 1234 5678 9010'
                                            className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50 font-mono'
                                        />
                                    </div>

                                    <div className='grid grid-cols-2 gap-4'>
                                        <div className='space-y-1.5'>
                                            <label className='text-zinc-500 text-xs font-semibold uppercase tracking-wider'>Expiry Date</label>
                                            <input 
                                                required
                                                type="text" 
                                                maxLength="5"
                                                value={cardExpiry}
                                                onFocus={() => setFocusedField('expiry')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={handleExpiryChange}
                                                placeholder='MM/YY'
                                                className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50 font-mono'
                                            />
                                        </div>
                                        <div className='space-y-1.5'>
                                            <label className='text-zinc-500 text-xs font-semibold uppercase tracking-wider'>CVV Code</label>
                                            <input 
                                                required
                                                type="password" 
                                                maxLength="3"
                                                value={cardCvv}
                                                onFocus={() => setFocusedField('cvv')}
                                                onBlur={() => setFocusedField('')}
                                                onChange={(e) => setCardCvv(e.target.value.replace(/[^0-9]/g, ''))}
                                                placeholder='123'
                                                className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50 font-mono'
                                            />
                                        </div>
                                    </div>
                                </div>

                                <button 
                                    type='submit' 
                                    className='w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm transition-all hover:bg-primary/95 shadow-md shadow-primary/10 hover:shadow-lg active:scale-99 mt-6'
                                >
                                    Proceed Secure Payment
                                </button>
                            </form>
                        )}

                        {/* Tab Content 2: UPI */}
                        {activeTab === 'upi' && (
                            <div className='space-y-6 text-center py-4 animate-fade-in'>
                                <div className='max-w-[200px] mx-auto p-4 bg-white border border-zinc-100 rounded-2xl shadow-md'>
                                    {/* Mock QR SVG */}
                                    <svg className="w-full h-full text-zinc-800" viewBox="0 0 100 100" fill="currentColor">
                                        <rect width="100" height="100" fill="white" />
                                        <rect x="5" y="5" width="20" height="20" />
                                        <rect x="10" y="10" width="10" height="10" fill="white" />
                                        <rect x="75" y="5" width="20" height="20" />
                                        <rect x="80" y="10" width="10" height="10" fill="white" />
                                        <rect x="5" y="75" width="20" height="20" />
                                        <rect x="10" y="80" width="10" height="10" fill="white" />
                                        <rect x="35" y="35" width="30" height="30" />
                                        <rect x="40" y="40" width="20" height="20" fill="white" />
                                        <rect x="45" y="45" width="10" height="10" />
                                        {/* Random mock QR pixels */}
                                        <rect x="30" y="5" width="10" height="10" />
                                        <rect x="45" y="5" width="10" height="15" />
                                        <rect x="60" y="5" width="10" height="10" />
                                        <rect x="5" y="30" width="10" height="10" />
                                        <rect x="5" y="45" width="15" height="10" />
                                        <rect x="5" y="60" width="10" height="10" />
                                        <rect x="75" y="30" width="10" height="15" />
                                        <rect x="85" y="45" width="10" height="10" />
                                        <rect x="75" y="60" width="15" height="10" />
                                        <rect x="30" y="75" width="10" height="15" />
                                        <rect x="45" y="85" width="15" height="10" />
                                        <rect x="65" y="75" width="10" height="10" />
                                    </svg>
                                </div>
                                <div className='space-y-1.5'>
                                    <h4 className='font-bold text-zinc-800 text-sm'>Scan QR with any Bank App</h4>
                                    <p className='text-zinc-400 text-xs'>Scan the generated code using GPay, PhonePe, Paytm, or your banking app.</p>
                                </div>
                                <div className='relative flex items-center justify-center my-4'>
                                    <div className='absolute inset-x-0 h-[1px] bg-zinc-100'></div>
                                    <span className='relative bg-white px-3 text-zinc-400 text-[10px] uppercase font-bold tracking-widest'>or pay via UPI ID</span>
                                </div>
                                <div className='space-y-3 max-w-sm mx-auto'>
                                    <input 
                                        type="text" 
                                        placeholder='username@okhdfcbank'
                                        className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50 text-center font-mono'
                                    />
                                    <button 
                                        onClick={() => setPaymentStatus('processing')}
                                        className='w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm transition-all hover:bg-primary/95 shadow-md shadow-primary/10 active:scale-99'
                                    >
                                        Verify & Pay
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Tab Content 3: Net Banking */}
                        {activeTab === 'netbanking' && (
                            <div className='space-y-6 animate-fade-in'>
                                <div className='grid grid-cols-2 gap-3'>
                                    {['HDFC Bank', 'ICICI Bank', 'SBI Bank', 'Axis Bank', 'Chase Bank', 'HSBC Bank'].map((bank, idx) => (
                                        <button 
                                            key={idx}
                                            onClick={() => setPaymentStatus('processing')}
                                            className='flex items-center gap-3 p-3 border border-zinc-200 rounded-xl hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-left text-zinc-700 font-semibold text-xs tracking-wide'
                                        >
                                            <div className='w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400 font-bold uppercase'>
                                                {bank.slice(0, 2)}
                                            </div>
                                            {bank}
                                        </button>
                                    ))}
                                </div>
                                <div className='space-y-1.5'>
                                    <label className='text-zinc-500 text-xs font-semibold uppercase tracking-wider'>Other Popular Banks</label>
                                    <select 
                                        onChange={() => setPaymentStatus('processing')}
                                        className='w-full px-4 py-2.5 border border-zinc-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all text-sm bg-zinc-50/50'
                                    >
                                        <option value="">Select your bank...</option>
                                        <option value="bank1">Bank of America</option>
                                        <option value="bank2">Barclays Bank</option>
                                        <option value="bank3">Citibank</option>
                                        <option value="bank4">Wells Fargo</option>
                                    </select>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className='flex items-center gap-2 justify-center mt-8 text-zinc-400 text-[10px] uppercase font-bold tracking-widest'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-green-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        PCI-DSS Compliant Secure Gateway
                    </div>
                </div>

                {/* Checkout Summary Card */}
                <div className='space-y-6'>
                    <div className='bg-zinc-50 rounded-2xl border border-zinc-100 p-6 sm:p-8 space-y-6'>
                        <div className='pb-4 border-b border-zinc-200/60'>
                            <h3 className='text-lg font-bold text-zinc-800'>Transaction Summary</h3>
                            <p className='text-zinc-400 text-xs mt-1'>Check your consultation schedule details.</p>
                        </div>
                        
                        {/* Doctor Details */}
                        <div className='flex gap-4 items-center bg-white p-4 rounded-xl border border-zinc-100 shadow-sm'>
                            <img className='w-16 h-16 object-cover rounded-lg bg-indigo-50 border border-zinc-100' src={appointment.docData.image} alt="" />
                            <div>
                                <h4 className='font-bold text-zinc-800 text-sm'>{appointment.docData.name}</h4>
                                <p className='text-xs text-zinc-400 font-medium mt-0.5'>{appointment.docData.speciality}</p>
                                <div className='flex items-center gap-1.5 mt-1'>
                                    <span className='px-2 py-0.5 rounded-full text-[9px] bg-primary/10 text-primary font-bold uppercase tracking-wider'>{appointment.docData.degree}</span>
                                    <span className='text-[10px] text-zinc-400 font-medium'>{appointment.docData.experience} Experience</span>
                                </div>
                            </div>
                        </div>

                        {/* Booking Schedule Details */}
                        <div className='space-y-3 bg-white p-4 rounded-xl border border-zinc-100 shadow-sm text-xs text-zinc-600'>
                            <div className='flex justify-between items-center'>
                                <span className='font-medium text-zinc-400'>Appointment Date</span>
                                <span className='font-bold text-zinc-800'>{appointment.slotDate}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='font-medium text-zinc-400'>Appointment Time</span>
                                <span className='font-bold text-zinc-800'>{appointment.slotTime}</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='font-medium text-zinc-400'>Venue</span>
                                <span className='font-bold text-zinc-800 truncate max-w-[150px]'>{appointment.docData.address.line1}</span>
                            </div>
                        </div>

                        {/* Payment calculation */}
                        <div className='space-y-3 pt-4 border-t border-zinc-200/60 text-sm'>
                            <div className='flex justify-between items-center'>
                                <span className='text-zinc-500 font-medium'>Consultation Fee</span>
                                <span className='text-zinc-800 font-bold'>${appointment.amount}.00</span>
                            </div>
                            <div className='flex justify-between items-center'>
                                <span className='text-zinc-500 font-medium'>Gateway Fee</span>
                                <span className='text-green-600 font-bold'>FREE</span>
                            </div>
                            <div className='flex justify-between items-center pt-3 border-t border-zinc-200/40 text-base'>
                                <span className='text-zinc-800 font-bold'>Total Payable</span>
                                <span className='text-primary font-extrabold text-lg'>${appointment.amount}.00</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className='flex items-center gap-3 p-4 bg-zinc-50/50 rounded-xl border border-zinc-100 text-xs text-zinc-500 leading-relaxed'>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 text-zinc-400">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                        </svg>
                        By clicking pay, you authorize this transaction. The amount is fully refundable in case of appointments canceled prior to 24 hours.
                    </div>
                </div>
            </div>
        </div>
    )
}

export default PayAppointment
