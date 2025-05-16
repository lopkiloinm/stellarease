"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  History,
  LogOut,
  Menu,
  QrCode,
  Search,
  Settings,
  Users,
  Wallet,
  Loader2,
  UserPlus,
  Edit,
  PlusCircle,
  User,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/lib/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

// Sample recent recipients data
const recentRecipients = [
  {
    id: "recent-1",
    name: "Alice Johnson",
    address: "GDPWK35JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQT4ZQP",
    lastUsed: "2 days ago",
  },
  {
    id: "recent-2",
    name: "Bob Smith",
    address: "GFXHS35JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQP9QR",
    lastUsed: "1 week ago",
  },
  {
    id: "recent-3",
    name: "Carol Williams",
    address: "GDHW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQK3LP",
    lastUsed: "2 weeks ago",
  },
  {
    id: "recent-4",
    name: "David Brown",
    address: "GAHK935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQR2MP",
    lastUsed: "3 weeks ago",
  },
  {
    id: "recent-5",
    name: "Eva Martinez",
    address: "GKLW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQT7NP",
    lastUsed: "1 month ago",
  },
]

// Sample saved contacts data
const savedContacts = [
  {
    id: "contact-1",
    name: "Alice Johnson",
    address: "GDPWK35JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQT4ZQP",
    lastUsed: "May 2, 2025",
  },
  {
    id: "contact-2",
    name: "Bob Smith",
    address: "GFXHS35JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQP9QR",
    lastUsed: "Apr 28, 2025",
  },
  {
    id: "contact-3",
    name: "Carol Williams",
    address: "GDHW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQK3LP",
    lastUsed: "Apr 15, 2025",
  },
  {
    id: "contact-4",
    name: "David Brown",
    address: "GAHK935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQR2MP",
    lastUsed: "Apr 10, 2025",
  },
  {
    id: "contact-5",
    name: "Eva Martinez",
    address: "GKLW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQT7NP",
    lastUsed: "Apr 5, 2025",
  },
  {
    id: "contact-6",
    name: "Frank Wilson",
    address: "GMNW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQP5KP",
    lastUsed: "Mar 28, 2025",
  },
  {
    id: "contact-7",
    name: "Grace Lee",
    address: "GPQW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQZ3JP",
    lastUsed: "Mar 20, 2025",
  },
  {
    id: "contact-8",
    name: "Henry Garcia",
    address: "GSTW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQX8HP",
    lastUsed: "Mar 15, 2025",
  },
  {
    id: "contact-9",
    name: "Ivy Robinson",
    address: "GUVW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQC1GP",
    lastUsed: "Mar 10, 2025",
  },
  {
    id: "contact-10",
    name: "Jack Thompson",
    address: "GXYW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQB6FP",
    lastUsed: "Mar 5, 2025",
  },
]

// Asset data
const assets = [
  {
    symbol: "XLM",
    name: "Stellar Lumens",
    price: 0.5,
    amount: 250,
    change: 2.5,
    color: "bg-blue-600",
    textColor: "text-blue-400",
    borderColor: "border-blue-600",
    hoverBg: "hover:bg-blue-900/20",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    price: 1.0,
    amount: 1125,
    change: 0.0,
    color: "bg-cyan-600",
    textColor: "text-cyan-400",
    borderColor: "border-cyan-600",
    hoverBg: "hover:bg-cyan-900/20",
  },
  {
    symbol: "BTC",
    name: "Bitcoin",
    price: 65000,
    amount: 0.015,
    change: 3.2,
    color: "bg-orange-600",
    textColor: "text-orange-400",
    borderColor: "border-orange-600",
    hoverBg: "hover:bg-orange-900/20",
  },
  {
    symbol: "ETH",
    name: "Ethereum",
    price: 3500,
    amount: 0.25,
    change: 1.8,
    color: "bg-indigo-600",
    textColor: "text-indigo-400",
    borderColor: "border-indigo-600",
    hoverBg: "hover:bg-indigo-900/20",
  },
  {
    symbol: "USDT",
    name: "Tether",
    price: 1.0,
    amount: 750,
    change: 0.1,
    color: "bg-green-600",
    textColor: "text-green-400",
    borderColor: "border-green-600",
    hoverBg: "hover:bg-green-900/20",
  },
  {
    symbol: "ALGO",
    name: "Algorand",
    price: 0.75,
    amount: 500,
    change: -1.2,
    color: "bg-purple-600",
    textColor: "text-purple-400",
    borderColor: "border-purple-600",
    hoverBg: "hover:bg-purple-900/20",
  },
]

// Function to get initials from name
const getInitials = (name: string) => {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2)
}

// Function to truncate address
const truncateAddress = (address: string) => {
  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`
}

// Fake scanned contact
const scannedContact = {
  id: "scanned-1",
  name: "Michael Rodriguez",
  address: "GZYW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQD8HP",
  lastUsed: "Never",
}

export default function SendPage() {
  const router = useRouter()
  const isMobile = useMobile()
  const [step, setStep] = useState<"select-recipient" | "enter-amount" | "confirm" | "success">("select-recipient")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRecipient, setSelectedRecipient] = useState<any | null>(null)
  const [selectedAsset, setSelectedAsset] = useState(assets[0])
  const [amount, setAmount] = useState("")
  const [message, setMessage] = useState("")
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [sendLoading, setSendLoading] = useState(false)
  const [scanningState, setScanningState] = useState<"idle" | "scanning" | "found">("idle")
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)
  const [newContactName, setNewContactName] = useState("")
  const [newContactAddress, setNewContactAddress] = useState("")
  const [mySavedContacts, setMySavedContacts] = useState(savedContacts)
  const [qrScanMode, setQrScanMode] = useState<"recipient" | "contact">("recipient")

  // Handle back navigation
  const handleBack = () => {
    if (step === "select-recipient") {
      router.back()
    } else if (step === "enter-amount") {
      setStep("select-recipient")
    } else if (step === "confirm") {
      setStep("enter-amount")
    }
  }

  // Filter contacts based on search query
  const filteredContacts = mySavedContacts.filter(
    (contact) =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.address.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  // Handle recipient selection
  const handleSelectRecipient = (recipient: any) => {
    setSelectedRecipient(recipient)
    setStep("enter-amount")
  }

  // Handle send transaction
  const handleSend = () => {
    setSendLoading(true)
    // Simulate transaction processing
    setTimeout(() => {
      setSendLoading(false)
      setStep("success")
    }, 1500)
  }

  // Handle QR code scanning
  const handleStartScanning = () => {
    setScanningState("scanning")
    // Simulate scanning process
    setTimeout(() => {
      setScanningState("found")
      if (qrScanMode === "contact") {
        setNewContactName(scannedContact.name)
        setNewContactAddress(scannedContact.address)
      }
    }, 3000)
  }

  // Handle adding scanned contact
  const handleAddScannedContact = () => {
    setNewContactName(scannedContact.name)
    setNewContactAddress(scannedContact.address)
    setShowAddContactDialog(true)
  }

  // Handle adding new contact
  const handleAddContact = () => {
    if (newContactName && newContactAddress) {
      const newContact = {
        id: `contact-${Date.now()}`,
        name: newContactName,
        address: newContactAddress,
        lastUsed: "Never",
      }
      setMySavedContacts([...mySavedContacts, newContact])
      setShowAddContactDialog(false)
      setNewContactName("")
      setNewContactAddress("")
    }
  }

  // Reset QR scanner state when hidden
  useEffect(() => {
    if (!showQrScanner) {
      setScanningState("idle")
    }
  }, [showQrScanner])

  // Find the QR Scanner component and update it to ensure the green checkmark is always in a circle
  // and the area is taller with better button placement

  // Replace the QR Scanner component with this improved version:

  const QrScanner = () => (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/50 h-[350px]">
      {scanningState === "idle" && (
        <>
          <QrCode className="h-16 w-16 text-gray-500 mb-4" />
          <p className="text-gray-400 text-center mb-4">
            {qrScanMode === "recipient"
              ? "Position a QR code in the camera view to scan a recipient"
              : "Scan a QR code to add a new contact"}
          </p>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleStartScanning}>
            Start Scanning
          </Button>
        </>
      )}

      {scanningState === "scanning" && (
        <>
          <div className="relative h-48 w-48 mb-4">
            <div className="absolute inset-0 border-2 border-blue-500 rounded-lg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-blue-500 animate-spin" />
            </div>
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-[scan_2s_ease-in-out_infinite]"></div>
          </div>
          <p className="text-gray-400 text-center">Scanning for QR code...</p>
        </>
      )}

      {scanningState === "found" && qrScanMode === "recipient" && (
        <>
          <div className="h-16 w-16 min-w-[4rem] rounded-full bg-green-600 flex items-center justify-center mb-4 flex-shrink-0">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-white text-lg font-medium mb-1">Contact Found!</p>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800 mb-6 w-full max-w-xs">
            <Avatar className="h-10 w-10 border border-gray-700">
              <AvatarFallback className="bg-blue-600 text-white">{getInitials(scannedContact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{scannedContact.name}</p>
              <p className="text-xs text-gray-400">{truncateAddress(scannedContact.address)}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 w-full"
              onClick={() => {
                setShowQrScanner(false)
                setScanningState("idle")
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() => {
                handleSelectRecipient(scannedContact)
                setShowQrScanner(false)
                setScanningState("idle")
              }}
            >
              Send to This Contact
            </Button>
          </div>
          <Button
            variant="outline"
            className="border-gray-700 bg-gray-800 text-blue-300 hover:bg-gray-700 hover:text-blue-200 w-full max-w-xs mt-3"
            onClick={handleAddScannedContact}
          >
            <UserPlus className="h-4 w-4 mr-1" />
            Save Contact
          </Button>
        </>
      )}

      {scanningState === "found" && qrScanMode === "contact" && (
        <>
          <div className="h-16 w-16 min-w-[4rem] rounded-full bg-green-600 flex items-center justify-center mb-4 flex-shrink-0">
            <Check className="h-8 w-8 text-white" />
          </div>
          <p className="text-white text-lg font-medium mb-1">Contact Found!</p>
          <div className="flex items-center gap-3 p-3 rounded-lg border border-gray-700 bg-gray-800 mb-6 w-full max-w-xs">
            <Avatar className="h-10 w-10 border border-gray-700">
              <AvatarFallback className="bg-blue-600 text-white">{getInitials(scannedContact.name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-white">{scannedContact.name}</p>
              <p className="text-xs text-gray-400">{truncateAddress(scannedContact.address)}</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 w-full"
              onClick={() => {
                setShowQrScanner(false)
                setScanningState("idle")
              }}
            >
              Cancel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() => {
                setShowQrScanner(false)
                setScanningState("idle")
                setShowAddContactDialog(true)
              }}
            >
              Add to Contacts
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-black/50 backdrop-blur supports-[backdrop-filter]:bg-black/20">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="text-xl font-bold">StellarEase</span>
          </div>

          {isMobile ? (
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-gray-700 bg-gray-800 text-white hover:bg-gray-700"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="border-gray-800 bg-gray-900 text-white">
                <div className="py-4">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
                    <span className="text-xl font-bold">StellarEase</span>
                  </div>
                  <nav className="grid gap-4">
                    <Link
                      href="/dashboard"
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Wallet className="h-5 w-5 text-gray-300" />
                      Dashboard
                    </Link>
                    <Link
                      href="/transactions"
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <History className="h-5 w-5 text-gray-300" />
                      Transactions
                    </Link>
                    <Link
                      href="/settings"
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Settings className="h-5 w-5 text-gray-300" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-800 my-4"></div>
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors text-left"
                    >
                      <ArrowLeft className="h-5 w-5 text-gray-300" />
                      {step === "select-recipient" ? "Back to Dashboard" : "Back"}
                    </button>
                    <Link
                      href="/"
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md text-red-400 hover:bg-red-900/30 transition-colors"
                    >
                      <LogOut className="h-5 w-5" />
                      Logout
                    </Link>
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          ) : (
            <nav className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <Wallet className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <History className="h-4 w-4" />
                Transactions
              </Link>
              <Link
                href="/settings"
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <Settings className="h-4 w-4" />
                Settings
              </Link>
              <div className="h-6 border-l border-gray-700 mx-2"></div>
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-red-400 hover:text-red-300 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Link>
            </nav>
          )}
        </div>
      </header>

      <main className="flex-1 py-8">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl">
          <div className="mb-6">
            <button
              className="flex items-center text-gray-400 hover:text-white transition-colors mb-4"
              onClick={handleBack}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              {step === "select-recipient"
                ? "Back to Dashboard"
                : step === "enter-amount"
                  ? "Back to Recipients"
                  : "Back"}
            </button>

            {step === "select-recipient" && <h1 className="text-3xl font-bold">Send Assets</h1>}
            {step === "enter-amount" && selectedRecipient && (
              <h1 className="text-3xl font-bold">Send to {selectedRecipient.name}</h1>
            )}
            {step === "confirm" && <h1 className="text-3xl font-bold">Confirm Transaction</h1>}
            {step === "success" && <h1 className="text-3xl font-bold">Transaction Complete</h1>}
          </div>

          <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
            <CardContent className="p-6">
              {step === "select-recipient" && (
                <div className="space-y-6">
                  {/* Search and QR Code */}
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                      <Input
                        placeholder="Search contacts..."
                        className="pl-9 border-gray-700 bg-gray-800 text-white"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      className="border-gray-700 bg-gray-800 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                      onClick={() => {
                        setQrScanMode("recipient")
                        setShowQrScanner(!showQrScanner)
                      }}
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* QR Scanner */}
                  {showQrScanner && <QrScanner />}

                  {!showQrScanner && (
                    <>
                      {/* Recent Recipients */}
                      <div>
                        <Label className="text-sm text-gray-400 mb-2 block">Recent Recipients</Label>
                        <div className="w-full overflow-x-auto pb-2">
                          <div className="flex w-max space-x-4 p-1">
                            {recentRecipients.map((recipient) => (
                              <button
                                key={recipient.id}
                                className="flex flex-col items-center space-y-2 w-20"
                                onClick={() => handleSelectRecipient(recipient)}
                              >
                                <div className="relative">
                                  <Avatar className="h-16 w-16 border-2 border-gray-700 bg-gray-800">
                                    <AvatarFallback className="bg-blue-600 text-white">
                                      {getInitials(recipient.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-gray-900 flex items-center justify-center border border-gray-700">
                                    <Clock className="h-3 w-3 text-gray-400" />
                                  </div>
                                </div>
                                <div className="text-center">
                                  <p className="text-xs font-medium text-white truncate max-w-full">{recipient.name}</p>
                                  <p className="text-xs text-gray-500 truncate max-w-full">{recipient.lastUsed}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Saved Contacts */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-sm text-gray-400">Saved Contacts</Label>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                              onClick={() => setShowAddContactDialog(true)}
                            >
                              <PlusCircle className="h-3.5 w-3.5 mr-1" />
                              Add
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                              asChild
                            >
                              <Link href="/settings?tab=contacts">
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Manage
                              </Link>
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
                          {filteredContacts.length > 0 ? (
                            filteredContacts.map((contact) => (
                              <button
                                key={contact.id}
                                className="flex items-center justify-between w-full p-3 rounded-lg border border-gray-800 bg-gray-800/50 hover:bg-gray-800 transition-colors text-left"
                                onClick={() => handleSelectRecipient(contact)}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10 border border-gray-700">
                                    <AvatarFallback className="bg-blue-600 text-white">
                                      {getInitials(contact.name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium text-white">{contact.name}</p>
                                    <p className="text-xs text-gray-400">{truncateAddress(contact.address)}</p>
                                  </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500" />
                              </button>
                            ))
                          ) : (
                            <div className="text-center py-8">
                              <Users className="h-12 w-12 mx-auto text-gray-600 mb-2" />
                              <p className="text-gray-400">No contacts found</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-4 border-gray-700 bg-gray-800 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                                onClick={() => setShowAddContactDialog(true)}
                              >
                                <UserPlus className="h-4 w-4 mr-1" />
                                Add New Contact
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {step === "enter-amount" && selectedRecipient && (
                <div className="space-y-6">
                  {/* Recipient Info */}
                  <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                        <User className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-white">{selectedRecipient.name}</div>
                        <div className="text-sm text-gray-400">{truncateAddress(selectedRecipient.address)}</div>
                        <div className="text-xs text-gray-500">Last used: {selectedRecipient.lastUsed || "Never"}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-gray-800 border-gray-700 text-red-300 hover:bg-gray-700 hover:text-red-200"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Asset Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="asset" className="text-white">
                      Select Asset
                    </Label>
                    <select
                      id="asset"
                      className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={selectedAsset.symbol}
                      onChange={(e) => {
                        const asset = assets.find((a) => a.symbol === e.target.value)
                        if (asset) setSelectedAsset(asset)
                      }}
                    >
                      {assets.map((asset) => (
                        <option key={asset.symbol} value={asset.symbol}>
                          {asset.symbol} - Balance: {asset.amount.toLocaleString()} ($
                          {(asset.price * asset.amount).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Amount */}
                  <div className="space-y-2">
                    <Label htmlFor="amount" className="text-white">
                      Amount
                    </Label>
                    <div className="relative">
                      <Input
                        id="amount"
                        type="number"
                        placeholder="0.00"
                        className="border-gray-700 bg-gray-800 text-white pr-16"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <span className="text-gray-400">{selectedAsset.symbol}</span>
                      </div>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">
                        Available: {selectedAsset.amount.toLocaleString()} {selectedAsset.symbol}
                      </span>
                      {amount && !isNaN(Number.parseFloat(amount)) && (
                        <span className="text-gray-400">
                          ≈ $
                          {(Number.parseFloat(amount) * selectedAsset.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label htmlFor="message" className="text-white">
                      Message (Optional)
                    </Label>
                    <Textarea
                      id="message"
                      placeholder="Add a note about this transaction..."
                      className="border-gray-700 bg-gray-800 text-white min-h-[80px]"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("select-recipient")}
                      className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={() => setStep("confirm")}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={
                        !amount ||
                        isNaN(Number.parseFloat(amount)) ||
                        Number.parseFloat(amount) <= 0 ||
                        Number.parseFloat(amount) > selectedAsset.amount
                      }
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              )}

              {step === "confirm" && selectedRecipient && (
                <div className="space-y-6">
                  <div className="rounded-lg border border-gray-800 bg-gray-800/50 p-4 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Recipient</span>
                      <span className="font-medium text-white">{selectedRecipient.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Asset</span>
                      <span className="font-medium text-white">{selectedAsset.symbol}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Amount</span>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          {Number.parseFloat(amount).toLocaleString()} {selectedAsset.symbol}
                        </div>
                        <div className="text-xs text-gray-400">
                          ≈ $
                          {(Number.parseFloat(amount) * selectedAsset.price).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Network Fee</span>
                      <span className="text-green-400">Covered by Launchtube</span>
                    </div>
                    {message && (
                      <div className="pt-2 border-t border-gray-700">
                        <span className="text-gray-400 text-sm block mb-1">Message:</span>
                        <p className="text-white text-sm">{message}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setStep("enter-amount")}
                      className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700"
                    >
                      Back
                    </Button>
                    <Button
                      onClick={handleSend}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                      disabled={sendLoading}
                    >
                      {sendLoading ? "Processing..." : "Send Now"}
                    </Button>
                  </div>
                </div>
              )}

              {step === "success" && (
                <div className="flex flex-col items-center justify-center py-6">
                  <div className="h-20 w-20 rounded-full bg-green-600 flex items-center justify-center mb-4">
                    <Check className="h-10 w-10 text-white" />
                  </div>
                  <p className="text-white text-lg font-medium mb-1">
                    {Number.parseFloat(amount).toLocaleString()} {selectedAsset.symbol} Sent
                  </p>
                  <p className="text-gray-400 mb-4">to {selectedRecipient?.name}</p>
                  <div className="bg-gray-800/50 rounded-lg border border-gray-800 p-3 text-center w-full max-w-xs">
                    <p className="text-gray-400 text-sm">Transaction ID:</p>
                    <p className="text-blue-400 text-xs font-mono">tx-{Math.random().toString(36).substring(2, 15)}</p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs mt-8">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/transactions")}
                      className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 w-full"
                    >
                      View Transactions
                    </Button>
                    <Button
                      onClick={() => router.push("/dashboard")}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Add Contact Dialog */}
      <Dialog
        open={showAddContactDialog}
        onOpenChange={(open) => {
          setShowAddContactDialog(open)
          if (!open) {
            setNewContactName("")
            setNewContactAddress("")
          }
        }}
      >
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Add New Contact</DialogTitle>
            <DialogDescription className="text-gray-400">
              Add a new contact to your saved contacts list.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact-name" className="text-white">
                Contact Name
              </Label>
              <Input
                id="contact-name"
                placeholder="Enter name"
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                className="border-gray-700 bg-gray-800 text-white"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contact-address" className="text-white">
                Wallet Address
              </Label>
              <div className="flex gap-2">
                <Input
                  id="contact-address"
                  placeholder="Enter Stellar address"
                  value={newContactAddress}
                  onChange={(e) => setNewContactAddress(e.target.value)}
                  className="border-gray-700 bg-gray-800 text-white flex-1"
                />
                <Button
                  variant="outline"
                  className="border-gray-700 bg-gray-800 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                  onClick={() => {
                    setShowAddContactDialog(false)
                    setQrScanMode("contact")
                    setShowQrScanner(true)
                    setScanningState("idle")
                  }}
                >
                  <QrCode className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleAddContact}
              disabled={!newContactName || !newContactAddress}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              Save Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <footer className="border-t border-gray-800 mt-12">
        <div className="container px-4 md:px-6 mx-auto max-w-7xl flex flex-col items-center justify-between gap-4 py-8 md:h-20 md:flex-row md:py-0">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600"></div>
            <span className="font-semibold text-white">StellarEase</span>
          </div>
          <p className="text-sm text-gray-500">&copy; 2025 StellarEase. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
