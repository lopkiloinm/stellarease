"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { ArrowLeft, Fingerprint, Info, Check, HelpCircle, Key, LogIn, UserPlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { usePasskey } from "@/lib/hooks/use-passkey"

type AuthStep = "choose" | "signIn" | "createPasskey" | "authenticating" | "success"

export default function AuthPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<AuthStep>("choose")
  const [passkeyName, setPasskeyName] = useState("")

  const { register, authenticate, setKeyName, keyName } = usePasskey()

  // Check for localStorage data on component mount
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const passkeyNameParam = params.get("passkeyName")

      if (passkeyNameParam) {
        // Set the passkey name from URL parameter
        setPasskeyName(passkeyNameParam)
        setKeyName(passkeyNameParam)
        // Go directly to create passkey step
        setStep("createPasskey")
      }
    }
  }, [setKeyName])

  const handleSignIn = async () => {
    setLoading(true)
    setStep("authenticating")
    try {
      await authenticate({
        onSuccess: () => {
          setLoading(false)
          setStep("success")
          // Redirect after showing success message
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        },
        onError: (error: Error) => {
          console.error('Passkey error:', error)
          setLoading(false)
          // Show more specific error messages based on the error type
          if (error.message.includes('No keyId found')) {
            setStep("choose")
            // You might want to show a toast or alert here
            alert('No passkey found. Please create a passkey first.')
          } else if (error.message.includes('timeout')) {
            setStep("choose")
            alert('Authentication timed out. Please try again.')
          } else {
            setStep("choose")
            alert('Authentication failed. Please try again.')
          }
        }
      })
    } catch (error) {
      console.error('Authentication failed:', error)
      setLoading(false)
      setStep("choose")
      alert('An unexpected error occurred. Please try again.')
    }
  }

  const handleCreatePasskey = async () => {
    if (!passkeyName.trim()) return

    setLoading(true)
    setStep("authenticating")
    try {
      await register({
        keyName: passkeyName,
        onSuccess: () => {
          setLoading(false)
          setStep("success")
          // Redirect after showing success message
          setTimeout(() => {
            router.push("/dashboard")
          }, 1500)
        },
        onError: (error: Error) => {
          console.error('Passkey error:', error)
          setLoading(false)
          setStep("choose")
        }
      })
    } catch (error) {
      console.error('Registration failed:', error)
      setLoading(false)
      setStep("choose")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <div className="container px-4 md:px-6 mx-auto max-w-7xl flex flex-1 items-center justify-center py-12">
        <Link
          href="/"
          className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>

        <Card className="mx-auto w-full max-w-md border-0 shadow-2xl bg-gradient-to-b from-gray-800 to-gray-900">
          <CardHeader className="space-y-1 text-center border-b border-gray-700 pb-6">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
              <span className="text-xl font-bold text-white">StellarEase</span>
            </div>
            <CardTitle className="text-2xl text-white">
              {step === "choose" && "Get Started"}
              {step === "signIn" && "Sign In"}
              {step === "createPasskey" && "Create a Passkey"}
              {step === "authenticating" && "Authenticating"}
              {step === "success" && "Success"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              {step === "choose" && "Sign in or create an account using passkeys"}
              {step === "signIn" && "Use your existing passkey to sign in"}
              {step === "createPasskey" && "Create a new passkey for your account"}
              {step === "authenticating" && "Please wait..."}
              {step === "success" && "Authentication successful"}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {step === "choose" && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center">
                  <Fingerprint className="h-14 w-14 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Choose an Option</h3>
                  <p className="text-gray-400">Sign in with an existing passkey or create a new one</p>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <Button
                    onClick={() => setStep("signIn")}
                    className="h-12 text-base bg-blue-600 hover:bg-blue-700 border-0 flex items-center justify-center gap-2 text-gray-200"
                  >
                    <LogIn className="h-5 w-5" />
                    Sign In with Passkey
                  </Button>

                  <Button
                    onClick={() => setStep("createPasskey")}
                    className="h-12 text-base bg-purple-600 hover:bg-purple-700 border-0 flex items-center justify-center gap-2 text-gray-200"
                  >
                    <UserPlus className="h-5 w-5" />
                    Create a Passkey
                  </Button>
                </div>

                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 transition-colors">
                      <HelpCircle className="h-4 w-4" />
                      <span>What are passkeys?</span>
                    </button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] bg-gray-900 border-gray-700 text-white">
                    <DialogHeader>
                      <DialogTitle className="text-white">About Passkeys</DialogTitle>
                      <DialogDescription className="text-gray-400">
                        A simpler and more secure alternative to passwords
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                          <Fingerprint className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">What are passkeys?</h4>
                          <p className="text-sm text-gray-400">
                            Passkeys are a replacement for passwords. They use your device's biometric sensors
                            (fingerprint, face recognition) or screen lock (PIN) to authenticate you.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-cyan-600 flex items-center justify-center flex-shrink-0">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">Why are passkeys better?</h4>
                          <p className="text-sm text-gray-400">
                            Passkeys are more secure than passwords because they're unique to each website, can't be
                            reused, phished, or leaked in a data breach. They're also easier to use - no more
                            remembering complex passwords.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <Info className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-white">How do passkeys work?</h4>
                          <p className="text-sm text-gray-400">
                            When you create a passkey, your device generates a unique cryptographic key pair. The
                            private key stays securely on your device, while the public key is sent to the website. When
                            you sign in, your device proves you own the private key by responding to a challenge from
                            the website.
                          </p>
                        </div>
                      </div>
                    </div>
                    <DialogClose asChild>
                      <Button className="w-full bg-blue-600 hover:bg-blue-700 border-0 text-gray-200">Got it</Button>
                    </DialogClose>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {step === "signIn" && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-blue-600 flex items-center justify-center">
                  <Key className="h-14 w-14 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Use Your Device</h3>
                  <p className="text-gray-400">
                    Sign in securely with your fingerprint, face recognition, or device PIN
                  </p>
                </div>

                <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 text-left">
                  <p className="font-medium mb-2 text-blue-400">How it works:</p>
                  <ol className="list-decimal pl-5 space-y-1">
                    <li>Click the button below to start</li>
                    <li>Your device will prompt you to use your fingerprint, face ID, or PIN</li>
                    <li>Authenticate to securely access your account</li>
                  </ol>
                </div>

                <div className="grid grid-cols-1 gap-4 w-full">
                  <Button
                    onClick={handleSignIn}
                    className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700 border-0 text-gray-200"
                    disabled={loading}
                  >
                    Continue with Passkey
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setStep("choose")}
                    className="w-full h-12 text-base bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Back
                  </Button>
                </div>
              </div>
            )}

            {step === "createPasskey" && (
              <div className="flex flex-col items-center text-center space-y-6">
                <div className="h-24 w-24 rounded-full bg-purple-600 flex items-center justify-center">
                  <UserPlus className="h-14 w-14 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Create Your Passkey</h3>
                  <p className="text-gray-400">Name your passkey and secure it with your device's biometrics</p>
                </div>

                <div className="w-full space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="passkeyName" className="text-sm font-medium text-gray-300 text-left block">
                      Passkey Name
                    </label>
                    <div className="relative">
                      <Input
                        id="passkeyName"
                        type="text"
                        placeholder="Choose Passkey Name"
                        value={passkeyName}
                        onChange={(e) => setPasskeyName(e.target.value)}
                        className="flex h-12 w-full rounded-md border border-gray-700 bg-gray-800 px-4 py-2 text-white shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
                      />
                    </div>
                    <p className="text-xs text-gray-400 text-left">
                      This helps you identify this passkey when you have multiple devices.
                    </p>
                  </div>

                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 text-left">
                    <p className="font-medium mb-2 text-purple-400">Next steps:</p>
                    <ol className="list-decimal pl-5 space-y-1">
                      <li>Enter a name for your passkey</li>
                      <li>Click the button below to create your passkey</li>
                      <li>Your device will prompt you to use your fingerprint, face ID, or PIN</li>
                    </ol>
                  </div>

                  <div className="grid grid-cols-1 gap-4 w-full">
                    <Button
                      onClick={handleCreatePasskey}
                      className="w-full h-12 text-base bg-purple-600 hover:bg-purple-700 border-0 text-gray-200"
                      disabled={loading || !passkeyName.trim()}
                    >
                      Create Passkey
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setStep("choose")}
                      className="w-full h-12 text-base bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700 hover:text-white"
                    >
                      Back
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {step === "authenticating" && (
              <div className="flex flex-col items-center text-center space-y-6 py-8">
                <div className="h-24 w-24 rounded-full bg-indigo-600 flex items-center justify-center animate-pulse">
                  <Fingerprint className="h-14 w-14 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Authenticating...</h3>
                  <p className="text-gray-400">Please respond to the prompt on your device</p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="flex flex-col items-center text-center space-y-6 py-8">
                <div className="h-24 w-24 rounded-full bg-cyan-600 flex items-center justify-center">
                  <Check className="h-14 w-14 text-white" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold text-white">Authentication Successful!</h3>
                  <p className="text-gray-400">Redirecting you to your dashboard...</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}