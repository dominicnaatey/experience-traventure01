'use client'

import { useState } from 'react'

interface PaymentFormProps {
  bookingId: string
  amount: number
  onSuccess: () => void
  onError: (error: string) => void
}

interface PaymentMethod {
  id: string
  name: string
  type: 'card' | 'mobile_money' | 'bank'
  provider: 'stripe' | 'paystack' | 'flutterwave'
  description: string
  icon: string
}

const paymentMethods: PaymentMethod[] = [
  {
    id: 'stripe_card',
    name: 'Credit/Debit Card',
    type: 'card',
    provider: 'stripe',
    description: 'Pay with Visa, Mastercard, or American Express',
    icon: '💳'
  },
  {
    id: 'paystack_card',
    name: 'Card (Paystack)',
    type: 'card',
    provider: 'paystack',
    description: 'Pay with your local or international card',
    icon: '💳'
  },
  {
    id: 'paystack_mobile',
    name: 'Mobile Money',
    type: 'mobile_money',
    provider: 'paystack',
    description: 'Pay with MTN, Airtel, or other mobile money',
    icon: '📱'
  },
  {
    id: 'paystack_bank',
    name: 'Bank Transfer',
    type: 'bank',
    provider: 'paystack',
    description: 'Direct bank transfer',
    icon: '🏦'
  }
]

export default function PaymentForm({ bookingId, amount, onSuccess, onError }: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null)
  const [loading, setLoading] = useState(false)
  const [cardDetails, setCardDetails] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  })
  const [mobileDetails, setMobileDetails] = useState({
    phone: '',
    network: ''
  })

  const handlePayment = async () => {
    if (!selectedMethod) {
      onError('Please select a payment method')
      return
    }

    setLoading(true)
    try {
      const paymentData = {
        bookingId,
        amount,
        method: selectedMethod.type,
        provider: selectedMethod.provider,
        ...(selectedMethod.type === 'card' && { cardDetails }),
        ...(selectedMethod.type === 'mobile_money' && { mobileDetails })
      }

      const response = await fetch('/api/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Payment failed')
      }

      const data = await response.json()

      // Handle different payment providers
      if (data.redirectUrl) {
        // Redirect to payment provider
        window.location.href = data.redirectUrl
      } else if (data.paymentUrl) {
        // Open payment popup
        window.open(data.paymentUrl, 'payment', 'width=600,height=600')
      } else {
        // Payment completed
        onSuccess()
      }
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Payment failed')
    } finally {
      setLoading(false)
    }
  }

  const formatCardNumber = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts: string[] = []
    
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const formatExpiry = (value: string): string => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4)
    }
    return v
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Complete Payment</h2>
        
        {/* Amount Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Total Amount</span>
            <span className="text-2xl font-bold text-indigo-600">${amount}</span>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Select Payment Method</h3>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                  selectedMethod?.id === method.id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedMethod(method)}
              >
                <div className="flex items-center">
                  <div className="text-2xl mr-3">{method.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{method.name}</div>
                    <div className="text-sm text-gray-500">{method.description}</div>
                  </div>
                  <div className="ml-3">
                    <input
                      type="radio"
                      checked={selectedMethod?.id === method.id}
                      onChange={() => setSelectedMethod(method)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Details Form */}
        {selectedMethod && selectedMethod.type === 'card' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Card Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={cardDetails.name}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={cardDetails.number}
                  onChange={(e) => setCardDetails(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    placeholder="MM/YY"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={cardDetails.expiry}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    placeholder="123"
                    maxLength={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    value={cardDetails.cvv}
                    onChange={(e) => setCardDetails(prev => ({ ...prev, cvv: e.target.value.replace(/\D/g, '') }))}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedMethod && selectedMethod.type === 'mobile_money' && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Mobile Money Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Network
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={mobileDetails.network}
                  onChange={(e) => setMobileDetails(prev => ({ ...prev, network: e.target.value }))}
                >
                  <option value="">Select Network</option>
                  <option value="mtn">MTN</option>
                  <option value="airtel">Airtel</option>
                  <option value="vodafone">Vodafone</option>
                  <option value="tigo">Tigo</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+233 XX XXX XXXX"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  value={mobileDetails.phone}
                  onChange={(e) => setMobileDetails(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* Security Notice */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-6">
          <div className="flex">
            <div className="shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Secure Payment</h3>
              <p className="mt-1 text-sm text-blue-700">
                Your payment information is encrypted and secure. We never store your card details.
              </p>
            </div>
          </div>
        </div>

        {/* Payment Button */}
        <button
          onClick={handlePayment}
          disabled={!selectedMethod || loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
        >
          {loading ? 'Processing...' : `Pay ${amount}`}
        </button>

        <p className="text-xs text-gray-500 mt-4 text-center">
          By clicking &quot;Pay&quot;, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}