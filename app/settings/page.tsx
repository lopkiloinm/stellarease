"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  Check,
  Globe,
  History,
  Key,
  LogOut,
  Menu,
  Plus,
  Settings,
  Shield,
  User,
  Users,
  Wallet,
  DollarSign,
  Fingerprint,
  Languages,
  Trash2,
  Edit,
  ExternalLink,
  AlertTriangle,
  X,
  QrCode,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/lib/hooks/use-mobile"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

// Fake scanned contact
const scannedContact = {
  id: "scanned-1",
  name: "Michael Rodriguez",
  address: "GZYW935JRYTL6GMQLT7JNVKMQWKEPJFQCL6OSN7R35WDNBCMXMQD8HP",
  lastUsed: "Never",
}

export default function SettingsPage() {
  const isMobile = useMobile()
  const [activeTab, setActiveTab] = useState("general")
  const [language, setLanguage] = useState("english")
  const [currency, setCurrency] = useState("usd")
  const [editContactId, setEditContactId] = useState<string | null>(null)
  const [newContactName, setNewContactName] = useState("")
  const [newContactAddress, setNewContactAddress] = useState("")
  const [showDeleteContactDialog, setShowDeleteContactDialog] = useState(false)
  const [contactToDelete, setContactToDelete] = useState<string | null>(null)
  const [showChangePasskeyDialog, setShowChangePasskeyDialog] = useState(false)
  const [newPasskeyName, setNewPasskeyName] = useState("")
  const [showRevokeAccessDialog, setShowRevokeAccessDialog] = useState(false)
  const [dappToRevoke, setDappToRevoke] = useState<string | null>(null)
  const [showQrScanner, setShowQrScanner] = useState(false)
  const [scanningState, setScanningState] = useState<"idle" | "scanning" | "found">("idle")
  const [showAddContactDialog, setShowAddContactDialog] = useState(false)

  // Handle tab query parameter
  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search)
      const tabParam = params.get("tab")
      if (tabParam === "contacts") {
        setActiveTab("contacts")
      }
    }
  }, [])

  // Reset QR scanner state when hidden
  useEffect(() => {
    if (!showQrScanner) {
      setScanningState("idle")
    }
  }, [showQrScanner])

  // Add global style for select options to ensure proper contrast
  const [optionStyle] = useState(`
    option {
      background-color: #1f2937;
      color: white;
    }
    @keyframes scan {
      0% { transform: translateY(0); }
      50% { transform: translateY(188px); }
      100% { transform: translateY(0); }
    }
  `)

  // Sample contacts data
  const [contacts, setContacts] = useState([
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
  ])

  // Sample connected dApps data
  const [connectedDapps, setConnectedDapps] = useState([
    {
      id: "dapp-1",
      name: "StellarSwap DEX",
      url: "https://stellarswap.finance",
      icon: "🔄",
      permissions: ["Read balance", "Request transactions"],
      lastUsed: "Today",
      riskLevel: "low",
    },
    {
      id: "dapp-2",
      name: "StellarNFT Marketplace",
      url: "https://stellarnft.market",
      icon: "🖼️",
      permissions: ["Read balance", "Request transactions", "View NFTs"],
      lastUsed: "Yesterday",
      riskLevel: "medium",
    },
    {
      id: "dapp-3",
      name: "StellarYield Farm",
      url: "https://stellaryield.farm",
      icon: "🌾",
      permissions: ["Read balance", "Request transactions", "Auto-compound"],
      lastUsed: "Apr 28, 2025",
      riskLevel: "high",
    },
  ])

  // Function to truncate address for display
  const truncateAddress = (address: string) => {
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

  // Function to get initials from name
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .substring(0, 2)
  }

  // Handle QR code scanning
  const handleStartScanning = () => {
    setScanningState("scanning")
    // Simulate scanning process
    setTimeout(() => {
      setScanningState("found")
      setNewContactName(scannedContact.name)
      setNewContactAddress(scannedContact.address)
    }, 3000)
  }

  // Handle adding a new contact
  const handleAddContact = () => {
    if (newContactName && newContactAddress) {
      const newContact = {
        id: `contact-${Date.now()}`,
        name: newContactName,
        address: newContactAddress,
        lastUsed: "Never",
      }
      setContacts([...contacts, newContact])
      setNewContactName("")
      setNewContactAddress("")
      setShowAddContactDialog(false)
      setShowQrScanner(false)
    }
  }

  // Handle editing a contact
  const handleEditContact = () => {
    if (editContactId && newContactName && newContactAddress) {
      const updatedContacts = contacts.map((contact) => {
        if (contact.id === editContactId) {
          return {
            ...contact,
            name: newContactName,
            address: newContactAddress,
          }
        }
        return contact
      })
      setContacts(updatedContacts)
      setEditContactId(null)
      setNewContactName("")
      setNewContactAddress("")
    }
  }

  // Handle deleting a contact
  const handleDeleteContact = () => {
    if (contactToDelete) {
      const updatedContacts = contacts.filter((contact) => contact.id !== contactToDelete)
      setContacts(updatedContacts)
      setContactToDelete(null)
      setShowDeleteContactDialog(false)
    }
  }

  // Handle revoking dApp access
  const handleRevokeDappAccess = () => {
    if (dappToRevoke) {
      const updatedDapps = connectedDapps.filter((dapp) => dapp.id !== dappToRevoke)
      setConnectedDapps(updatedDapps)
      setDappToRevoke(null)
      setShowRevokeAccessDialog(false)
    }
  }

  // Handle changing passkey
  const handleChangePasskey = () => {
    if (newPasskeyName) {
      // In a real app, this would trigger the passkey creation process
      console.log(`Creating new passkey: ${newPasskeyName}`)
      setNewPasskeyName("")
      setShowChangePasskeyDialog(false)
    }
  }

  // Get risk badge for dApp
  const getRiskBadge = (riskLevel: string) => {
    switch (riskLevel) {
      case "low":
        return (
          <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-600/50">Low Risk</Badge>
        )
      case "medium":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border-yellow-600/50">
            Medium Risk
          </Badge>
        )
      case "high":
        return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/50">High Risk</Badge>
      default:
        return null
    }
  }

  // QR Scanner mock component
  const QrScanner = () => (
    <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-700 rounded-lg bg-gray-800/50 h-[350px]">
      {scanningState === "idle" && (
        <>
          <QrCode className="h-16 w-16 text-gray-500 mb-4" />
          <p className="text-gray-400 text-center mb-4">Scan a QR code to add a new contact</p>
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

      {scanningState === "found" && (
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
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full"
              onClick={() => {
                setShowAddContactDialog(true)
                setShowQrScanner(false)
              }}
            >
              Add to Contacts
            </Button>
            <Button
              variant="outline"
              className="border-gray-700 bg-gray-800 text-gray-300 hover:bg-gray-700 w-full"
              onClick={() => {
                setShowQrScanner(false)
                setScanningState("idle")
                setNewContactName("")
                setNewContactAddress("")
              }}
            >
              Cancel
            </Button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-black via-gray-900 to-slate-900 text-white">
      <style jsx global>
        {optionStyle}
      </style>
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
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md bg-blue-600"
                    >
                      <Settings className="h-5 w-5 text-white" />
                      Settings
                    </Link>
                    <div className="border-t border-gray-800 my-4"></div>
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
                className="flex items-center gap-2 text-sm font-medium text-white border-b-2 border-blue-600 pb-[17px]"
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
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account preferences and security</p>
          </div>

          <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-gray-800 border border-gray-700 p-1 mb-6">
              <TabsTrigger
                value="general"
                className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300"
              >
                <Globe className="h-4 w-4 mr-2" />
                General
              </TabsTrigger>
              <TabsTrigger
                value="contacts"
                className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300"
              >
                <Users className="h-4 w-4 mr-2" />
                Contacts
              </TabsTrigger>
              <TabsTrigger
                value="security"
                className="text-gray-300 data-[state=active]:bg-blue-900/40 data-[state=active]:text-blue-300"
              >
                <Shield className="h-4 w-4 mr-2" />
                Security
              </TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-6">
              <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Languages className="h-5 w-5 mr-2 text-blue-400" />
                    Language
                  </CardTitle>
                  <CardDescription className="text-gray-400">Choose your preferred language</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">English</div>
                          <div className="text-sm text-gray-400">Default language</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {language === "english" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setLanguage("english")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Spanish</div>
                          <div className="text-sm text-gray-400">Español</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {language === "spanish" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setLanguage("spanish")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-purple-600 flex items-center justify-center">
                          <Globe className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">French</div>
                          <div className="text-sm text-gray-400">Français</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {language === "french" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setLanguage("french")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <DollarSign className="h-5 w-5 mr-2 text-green-400" />
                    Currency
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Choose your preferred currency for displaying values
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-green-600 flex items-center justify-center">
                          <span className="font-semibold text-white text-lg">$</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">US Dollar (USD)</div>
                          <div className="text-sm text-gray-400">Default currency</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {currency === "usd" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setCurrency("usd")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="font-semibold text-white text-lg">€</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">Euro (EUR)</div>
                          <div className="text-sm text-gray-400">European Union</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {currency === "eur" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setCurrency("eur")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-yellow-600 flex items-center justify-center">
                          <span className="font-semibold text-white text-lg">£</span>
                        </div>
                        <div>
                          <div className="font-medium text-white">British Pound (GBP)</div>
                          <div className="text-sm text-gray-400">United Kingdom</div>
                        </div>
                      </div>
                      <div className="flex items-center">
                        {currency === "gbp" && (
                          <div className="h-6 w-6 rounded-full bg-green-600 flex items-center justify-center">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                          onClick={() => setCurrency("gbp")}
                        >
                          Select
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6">
              <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-white">
                        <Users className="h-5 w-5 mr-2 text-blue-400" />
                        Contacts
                      </CardTitle>
                      <CardDescription className="text-gray-400">Manage your saved contacts</CardDescription>
                    </div>
                    <Dialog
                      onOpenChange={(open) => {
                        if (!open) {
                          setNewContactName("")
                          setNewContactAddress("")
                        }
                      }}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          <Plus className="h-4 w-4 mr-1" />
                          Add Contact
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                        <DialogHeader>
                          <DialogTitle className="text-white">Add New Contact</DialogTitle>
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
                  </div>
                </CardHeader>
                <CardContent>
                  {showQrScanner ? (
                    <QrScanner />
                  ) : (
                    <div className="grid gap-4">
                      {contacts.map((contact) => (
                        <div
                          key={contact.id}
                          className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                            <div>
                              <div className="font-medium text-white">{contact.name}</div>
                              <div className="text-sm text-gray-400">{truncateAddress(contact.address)}</div>
                              <div className="text-xs text-gray-500">Last used: {contact.lastUsed}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-8 w-8 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                                <DialogHeader>
                                  <DialogTitle className="text-white">Edit Contact</DialogTitle>
                                  <DialogDescription className="text-gray-400">
                                    Update contact information
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-contact-name" className="text-white">
                                      Contact Name
                                    </Label>
                                    <Input
                                      id="edit-contact-name"
                                      placeholder="Enter name"
                                      defaultValue={contact.name}
                                      onChange={(e) => setNewContactName(e.target.value)}
                                      className="border-gray-700 bg-gray-800 text-white"
                                    />
                                  </div>
                                  <div className="grid gap-2">
                                    <Label htmlFor="edit-contact-address" className="text-white">
                                      Wallet Address
                                    </Label>
                                    <Input
                                      id="edit-contact-address"
                                      placeholder="Enter Stellar address"
                                      defaultValue={contact.address}
                                      onChange={(e) => setNewContactAddress(e.target.value)}
                                      className="border-gray-700 bg-gray-800 text-white"
                                    />
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    onClick={() => {
                                      setEditContactId(contact.id)
                                      handleEditContact()
                                    }}
                                    className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-8 w-8 bg-gray-800 border-gray-700 text-red-300 hover:bg-gray-700 hover:text-red-200"
                              onClick={() => {
                                setContactToDelete(contact.id)
                                setShowDeleteContactDialog(true)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {contacts.length === 0 && (
                        <div className="text-center py-8">
                          <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                            <Users className="h-8 w-8 text-gray-500" />
                          </div>
                          <h3 className="text-lg font-medium text-white mb-2">No contacts yet</h3>
                          <p className="text-gray-400 max-w-md mx-auto">
                            Add contacts to easily send assets to frequently used addresses.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Dialog open={showDeleteContactDialog} onOpenChange={setShowDeleteContactDialog}>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Delete Contact</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Are you sure you want to delete this contact? This action cannot be undone.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteContactDialog(false)}
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleDeleteContact} className="bg-red-600 hover:bg-red-700 text-white">
                      Delete
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

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
                      <Label htmlFor="contact-name-dialog" className="text-white">
                        Contact Name
                      </Label>
                      <Input
                        id="contact-name-dialog"
                        placeholder="Enter name"
                        value={newContactName}
                        onChange={(e) => setNewContactName(e.target.value)}
                        className="border-gray-700 bg-gray-800 text-white"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="contact-address-dialog" className="text-white">
                        Wallet Address
                      </Label>
                      <Input
                        id="contact-address-dialog"
                        placeholder="Enter Stellar address"
                        value={newContactAddress}
                        onChange={(e) => setNewContactAddress(e.target.value)}
                        className="border-gray-700 bg-gray-800 text-white"
                      />
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
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Fingerprint className="h-5 w-5 mr-2 text-blue-400" />
                    Passkey Management
                  </CardTitle>
                  <CardDescription className="text-gray-400">Manage your authentication passkeys</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                          <Key className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-white">Primary Passkey</div>
                          <div className="text-sm text-gray-400">Created on May 1, 2025</div>
                          <div className="text-xs text-gray-500">Last used: Today</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                        onClick={() => setShowChangePasskeyDialog(true)}
                      >
                        Change
                      </Button>
                    </div>
                  </div>

                  <Dialog open={showChangePasskeyDialog} onOpenChange={setShowChangePasskeyDialog}>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle className="text-white">Change Passkey</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Create a new passkey for your account
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="passkey-name" className="text-white">
                            Passkey Name
                          </Label>
                          <Input
                            id="passkey-name"
                            placeholder="Enter a name for your passkey"
                            value={newPasskeyName}
                            onChange={(e) => setNewPasskeyName(e.target.value)}
                            className="border-gray-700 bg-gray-800 text-white"
                          />
                        </div>
                        <div className="bg-blue-900/20 border border-blue-700 rounded-md p-3 text-sm text-blue-300">
                          <p className="font-medium mb-1">Important:</p>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>You'll need to authenticate with your current passkey first</li>
                            <li>Your device will prompt you to create a new passkey</li>
                            <li>This will not affect your wallet or assets</li>
                          </ul>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleChangePasskey}
                          disabled={!newPasskeyName}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          Create New Passkey
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center text-white">
                        <ExternalLink className="h-5 w-5 mr-2 text-blue-400" />
                        Connected dApps
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Manage which decentralized applications have access to your wallet
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    {connectedDapps.map((dapp) => (
                      <div
                        key={dapp.id}
                        className="flex flex-col md:flex-row md:items-center justify-between p-3 rounded-lg border border-gray-800 bg-gray-800/50 gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                            <span className="text-xl">{dapp.icon}</span>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-medium text-white">{dapp.name}</div>
                              {getRiskBadge(dapp.riskLevel)}
                            </div>
                            <div className="text-sm text-gray-400">{dapp.url}</div>
                            <div className="text-xs text-gray-500 mt-1">Last used: {dapp.lastUsed}</div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <div className="text-sm text-gray-300 bg-gray-800 p-2 rounded-md border border-gray-700">
                            <div className="font-medium mb-1 text-white">Permissions:</div>
                            <div className="flex flex-wrap gap-1">
                              {dapp.permissions.map((permission, index) => (
                                <span key={index} className="text-xs bg-gray-700 px-2 py-1 rounded-md text-white">
                                  {permission}
                                </span>
                              ))}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-gray-800 border-gray-700 text-red-300 hover:bg-gray-700 hover:text-red-200 self-end"
                            onClick={() => {
                              setDappToRevoke(dapp.id)
                              setShowRevokeAccessDialog(true)
                            }}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Revoke Access
                          </Button>
                        </div>
                      </div>
                    ))}

                    {connectedDapps.length === 0 && (
                      <div className="text-center py-8">
                        <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                          <ExternalLink className="h-8 w-8 text-gray-500" />
                        </div>
                        <h3 className="text-lg font-medium text-white mb-2">No connected dApps</h3>
                        <p className="text-gray-400 max-w-md mx-auto">
                          You haven't connected your wallet to any decentralized applications yet.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="mt-6 bg-yellow-900/20 border border-yellow-700 rounded-md p-4 text-sm text-yellow-300">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium mb-1">Security Notice:</p>
                        <p>
                          Only connect your wallet to trusted dApps. Malicious applications can request transactions
                          that may compromise your assets. Always verify permissions before approving connections.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={showRevokeAccessDialog} onOpenChange={setShowRevokeAccessDialog}>
                <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle className="text-white">Revoke dApp Access</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Are you sure you want to revoke access for this dApp? You'll need to reconnect and approve
                      permissions again if you want to use it in the future.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="flex gap-2 sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowRevokeAccessDialog(false)}
                      className="bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700"
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleRevokeDappAccess} className="bg-red-600 hover:bg-red-700 text-white">
                      Revoke Access
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          </Tabs>
        </div>
      </main>

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
