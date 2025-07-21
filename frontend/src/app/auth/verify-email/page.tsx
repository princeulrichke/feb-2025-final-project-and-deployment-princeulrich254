'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { authAPI } from '@/lib/api'
import { useAuthStore } from '@/store/auth'
import toast from 'react-hot-toast'
import { CheckCircle, XCircle, Mail } from 'lucide-react'

function VerifyEmailContent() {
  const [isLoading, setIsLoading] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending')
  const [error, setError] = useState('')
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const { user } = useAuthStore()

  useEffect(() => {
    if (token) {
      verifyEmail(token)
    }
  }, [token])

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true)
    setError('')

    try {
      await authAPI.verifyEmail(verificationToken)
      setVerificationStatus('success')
      toast.success('Email verified successfully!')
    } catch (err: any) {
      setVerificationStatus('error')
      setError(err.response?.data?.message || 'Email verification failed')
      toast.error('Email verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerification = async () => {
    setIsLoading(true)
    setError('')

    try {
      await authAPI.resendVerification()
      toast.success('Verification email sent!')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send verification email')
      toast.error('Failed to send verification email')
    } finally {
      setIsLoading(false)
    }
  }

  if (verificationStatus === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <CardTitle>Email Verified!</CardTitle>
              <CardDescription>
                Your email has been successfully verified. You can now access all features of your account.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <Button asChild>
                  <Link href="/dashboard">
                    Go to Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (verificationStatus === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <Card>
            <CardHeader className="text-center">
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle>Verification Failed</CardTitle>
              <CardDescription>
                {error || 'The verification link is invalid or has expired.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={resendVerification}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <div className="text-center">
                  <Button variant="outline" asChild>
                    <Link href="/dashboard">
                      Go to Dashboard
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Pending state - waiting for verification or no token provided
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <Card>
          <CardHeader className="text-center">
            <Mail className="w-16 h-16 text-blue-500 mx-auto mb-4" />
            <CardTitle>
              {isLoading ? 'Verifying...' : 'Verify Your Email'}
            </CardTitle>
            <CardDescription>
              {token 
                ? 'Please wait while we verify your email address...'
                : "We've sent you a verification email. Check your inbox and click the verification link."
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            {!token && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 text-center">
                  Didn't receive the email? Check your spam folder or click below to resend.
                </p>
                <Button
                  onClick={resendVerification}
                  disabled={isLoading}
                  className="w-full"
                  variant="outline"
                >
                  {isLoading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <div className="text-center">
                  <Button variant="ghost" asChild>
                    <Link href="/dashboard">
                      Skip for now
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
