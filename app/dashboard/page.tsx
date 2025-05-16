"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  ArrowRight,
  ArrowDown,
  History,
  LogOut,
  Menu,
  Plus,
  Settings,
  ChevronRight,
  Wallet,
  Search,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/lib/hooks/use-mobile"
import { native, fundPubkey, fundSigner, server } from '@/lib/common'

export default function DashboardPage() {
  const isMobile = useMobile()
  const [buyLoading, setBuyLoading] = useState(false)
  const [swapLoading, setSwapLoading] = useState(false)
  const [showBlockchainDetails, setShowBlockchainDetails] = useState(false)
  const [searchAsset, setSearchAsset] = useState("")
  const [copied, setCopied] = useState(false)
  const [swapFromAsset, setSwapFromAsset] = useState("xlm")
  const [swapToAsset, setSwapToAsset] = useState("usdc")
  const [swapAmount, setSwapAmount] = useState("")
  const [swapEstimate, setSwapEstimate] = useState("")
  const [xlmBalance, setXlmBalance] = useState("0")
  const [transactions, setTransactions] = useState<Array<{
    type: 'buy' | 'send' | 'receive',
    asset: string,
    amount: number,
    usdValue: number,
    date: Date,
    status: 'completed' | 'pending' | 'failed'
  }>>([])

  // Get wallet address from localStorage
  const [walletAddress, setWalletAddress] = useState<string>("")

  // Load wallet address and balance on component mount
  useEffect(() => {
    const storedContractId = localStorage.getItem('sp:contractId')
    if (storedContractId && storedContractId.startsWith('C')) {
      setWalletAddress(storedContractId)
      getWalletBalance(storedContractId)
    }
  }, [])

  // Get real XLM balance
  const getWalletBalance = async (contractId: string) => {
    try {
      if (!contractId || !contractId.startsWith('C')) {
        console.error('Invalid contract ID format:', contractId)
        return
      }
      const { result } = await native.balance({ id: contractId })
      // Store the full precision balance
      setXlmBalance(result.toString())
    } catch (err) {
      console.error('Error getting balance:', err)
    }
  }

  // Fund wallet with XLM
  const fundWallet = async (amount: number = 100) => {
    try {
      const response = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fund_wallet',
          walletAddress,
          amount: amount * 10_000_000 // Convert to stroops
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fund wallet');
      }

      console.log('Funding result:', data);
      await getWalletBalance(walletAddress);
    } catch (error) {
      console.error('Error funding wallet:', error);
      throw error;
    }
  }

  // Add transaction to history
  const addTransaction = (type: 'buy' | 'send' | 'receive', asset: string, amount: number, usdValue: number) => {
    const newTransaction = {
      type,
      asset,
      amount,
      usdValue,
      date: new Date(),
      status: 'completed' as const
    }
    setTransactions(prev => [newTransaction, ...prev])
  }

  // Update handleBuy to add transaction
  const handleBuy = async (usdAmount: number) => {
    try {
      if (!walletAddress) {
        throw new Error('No wallet address found');
      }

      setBuyLoading(true);

      // Convert USD to stroops (1 USD = 20,000,000 stroops)
      const stroopsAmount = usdAmount * 20_000_000;

      console.log('Converting amount:', {
        usdAmount,
        stroopsAmount,
        calculation: `${usdAmount} * 20_000_000 = ${stroopsAmount}`
      });

      // Fund the wallet using Mercury API
      const response = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'fund_wallet',
          walletAddress,
          amount: stroopsAmount
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fund wallet');
      }

      if (!data.success) {
        throw new Error('Transaction failed');
      }

      // Add transaction to history
      addTransaction('buy', 'XLM', usdAmount / 0.5, usdAmount); // Assuming 1 XLM = $0.50

      // Refresh wallet balance
      await getWalletBalance(walletAddress);

    } catch (error) {
      console.error('Error in buy flow:', error);
      throw error;
    } finally {
      setBuyLoading(false);
    }
  };

  // Helper function to format XLM balance for display
  const formatXlmBalance = (balance: string) => {
    // Convert from stroops to XLM and format to 2 decimal places
    const xlmAmount = Number(balance) / 10_000_000;
    return xlmAmount.toFixed(2);
  };

  const handleSwap = () => {
    setSwapLoading(true)
    // Simulate transaction
    setTimeout(() => {
      setSwapLoading(false)
    }, 1500)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Calculate swap estimate when amount or assets change
  const calculateSwapEstimate = (amount: string, fromAsset: string, toAsset: string) => {
    if (!amount || isNaN(Number.parseFloat(amount))) {
      setSwapEstimate("")
      return
    }

    const fromAssetData = assets.find((a) => a.symbol.toLowerCase() === fromAsset.toLowerCase())
    const toAssetData = assets.find((a) => a.symbol.toLowerCase() === toAsset.toLowerCase())

    if (!fromAssetData || !toAssetData) {
      setSwapEstimate("")
      return
    }

    // Simple conversion based on asset prices
    const amountNum = Number.parseFloat(amount)
    const fromValue = amountNum * fromAssetData.price
    const toAmount = fromValue / toAssetData.price

    // Format the result based on the asset type
    const formatted = toAssetData.price >= 100 ? toAmount.toFixed(8) : toAmount.toFixed(toAssetData.price < 1 ? 4 : 2)

    setSwapEstimate(formatted)
  }

  // Handle swap amount change
  const handleSwapAmountChange = (value: string) => {
    setSwapAmount(value)
    calculateSwapEstimate(value, swapFromAsset, swapToAsset)
  }

  // Handle swap asset change
  const handleSwapAssetChange = (asset: string, isFrom: boolean) => {
    if (isFrom) {
      setSwapFromAsset(asset)
      calculateSwapEstimate(swapAmount, asset, swapToAsset)
    } else {
      setSwapToAsset(asset)
      calculateSwapEstimate(swapAmount, swapFromAsset, asset)
    }
  }

  // Swap the from and to assets
  const handleReverseSwap = () => {
    const temp = swapFromAsset
    setSwapFromAsset(swapToAsset)
    setSwapToAsset(temp)
    calculateSwapEstimate(swapAmount, swapToAsset, swapFromAsset)
  }

  // Asset data
  const assets = [
    {
      symbol: "XLM",
      name: "Stellar Lumens",
      price: 0.5, // 1 XLM = $0.50
      amount: Number(formatXlmBalance(xlmBalance)),
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

  // Calculate total portfolio value
  const totalValue = assets.reduce((total, asset) => total + asset.price * asset.amount, 0)

  // Filter assets based on search
  const filteredAssets = assets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchAsset.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchAsset.toLowerCase()),
  )

  // Function to truncate address for display
  const truncateAddress = (address: string) => {
    if (!address) return "Loading..."
    return `${address.substring(0, 8)}...${address.substring(address.length - 8)}`
  }

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
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md bg-blue-600"
                    >
                      <Wallet className="h-5 w-5 text-white" />
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
                className="flex items-center gap-2 text-sm font-medium text-white border-b-2 border-blue-600 pb-[17px]"
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
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <p className="text-gray-400 mt-1">Manage your assets and transactions</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBlockchainDetails(!showBlockchainDetails)}
              className="self-start sm:self-auto bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
            >
              {showBlockchainDetails ? "Hide" : "Show"} Blockchain Details
            </Button>
          </div>

          {showBlockchainDetails && (
            <div className="mb-6 p-4 rounded-lg border border-blue-600 bg-blue-900/20 text-white">
              <h3 className="text-lg font-medium mb-2 text-blue-300">Blockchain Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Wallet Address:</p>
                  <div className="flex flex-col gap-2">
                    <div className="bg-gray-800 p-2 rounded-md border border-gray-700 overflow-hidden">
                      <div className="overflow-x-auto whitespace-nowrap scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-gray-800 pb-1">
                        <code className="text-xs font-mono text-gray-300">
                          {truncateAddress(walletAddress)}
                        </code>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(walletAddress)}
                        className="h-7 px-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? "Copied!" : "Copy Address"}
                      </Button>
                      <span className="text-xs text-gray-400">or</span>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                        onClick={() => window.open(`https://stellar.expert/explorer/testnet/contract/${walletAddress}`, '_blank')}
                      >
                        View on Explorer
                      </Button>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-300 mb-1">Network Details:</p>
                  <ul className="text-sm text-gray-300 space-y-1">
                    <li>
                      Network: <span className="text-blue-300">Stellar</span>
                    </li>
                    <li>
                      Gas Fees: <span className="text-green-300">Covered by Launchtube</span>
                    </li>
                    <li>
                      Transaction Speed: <span className="text-blue-300">&lt;5 seconds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Assets Card - Now Full Width and Prominent */}
          <Card className="overflow-hidden border-0 shadow-md bg-gray-900 border-gray-800 mb-6">
            <CardHeader className="pb-2 bg-purple-600 text-white">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl">Your Assets</CardTitle>
                  <CardDescription className="text-purple-100">
                    Total Value: $
                    {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </CardDescription>
                </div>
                <div className="flex flex-wrap gap-2 justify-start sm:justify-end">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white sm:px-3">
                        <Plus className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Buy</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Buy Digital Assets</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Purchase digital assets with your connected payment method.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="asset" className="text-white">
                            Select Asset
                          </Label>
                          <select className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {assets.map((asset) => (
                              <option key={asset.symbol} value={asset.symbol.toLowerCase()}>
                                {asset.symbol} ({asset.name})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="amount" className="text-white">
                            Amount (USD)
                          </Label>
                          <Input
                            id="amount"
                            type="number"
                            placeholder="100.00"
                            min="1"
                            className="border-gray-700 bg-gray-800 text-white"
                          />
                        </div>
                        {showBlockchainDetails && (
                          <div className="rounded-md bg-purple-900/20 p-4 text-sm border border-purple-700">
                            <div className="font-medium text-purple-400 mb-1">Transaction Details:</div>
                            <div className="text-purple-300">
                              <div>Network: Stellar</div>
                              <div>Gas Fee: Covered by Launchtube</div>
                              <div>Estimated Time: &lt;5 seconds</div>
                            </div>
                          </div>
                        )}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => {
                            const amountInput = document.getElementById('amount') as HTMLInputElement;
                            const usdAmount = parseFloat(amountInput.value);
                            if (isNaN(usdAmount) || usdAmount <= 0) {
                              alert('Please enter a valid amount');
                              return;
                            }
                            handleBuy(usdAmount);
                          }}
                          disabled={buyLoading}
                          className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          {buyLoading ? "Processing..." : "Buy Now"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white sm:px-3">
                        <RefreshCw className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Swap</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Swap Assets</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Exchange one digital asset for another instantly.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="from-asset" className="text-white">
                            From
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              id="from-asset"
                              value={swapFromAsset}
                              onChange={(e) => handleSwapAssetChange(e.target.value, true)}
                              className="col-span-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                            >
                              {assets.map((asset) => (
                                <option key={`from-${asset.symbol}`} value={asset.symbol.toLowerCase()}>
                                  {asset.symbol}
                                </option>
                              ))}
                            </select>
                            <Input
                              type="number"
                              placeholder="Amount"
                              value={swapAmount}
                              onChange={(e) => handleSwapAmountChange(e.target.value)}
                              className="col-span-2 border-gray-700 bg-gray-800 text-white"
                            />
                          </div>
                        </div>

                        <div className="flex justify-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleReverseSwap}
                            className="h-8 w-8 rounded-full bg-gray-800 hover:bg-gray-700"
                          >
                            <RefreshCw className="h-4 w-4 text-gray-300" />
                          </Button>
                        </div>

                        <div className="grid gap-2">
                          <Label htmlFor="to-asset" className="text-white">
                            To (Estimated)
                          </Label>
                          <div className="grid grid-cols-3 gap-2">
                            <select
                              id="to-asset"
                              value={swapToAsset}
                              onChange={(e) => handleSwapAssetChange(e.target.value, false)}
                              className="col-span-1 h-10 rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white"
                            >
                              {assets.map((asset) => (
                                <option key={`to-${asset.symbol}`} value={asset.symbol.toLowerCase()}>
                                  {asset.symbol}
                                </option>
                              ))}
                            </select>
                            <div className="col-span-2 flex items-center px-3 h-10 rounded-md border border-gray-700 bg-gray-700 text-white">
                              {swapEstimate ? swapEstimate : "0.00"}
                            </div>
                          </div>
                        </div>

                        <div className="rounded-md bg-blue-900/20 p-3 text-sm border border-blue-700">
                          <div className="font-medium text-blue-400 mb-1">Swap Details:</div>
                          <div className="text-blue-300 text-xs">
                            <div className="flex justify-between">
                              <span>Exchange Rate:</span>
                              <span>
                                1 {swapFromAsset.toUpperCase()} ≈ {(() => {
                                  const fromAssetData = assets.find(
                                    (a) => a.symbol.toLowerCase() === swapFromAsset.toLowerCase(),
                                  )
                                  const toAssetData = assets.find(
                                    (a) => a.symbol.toLowerCase() === swapToAsset.toLowerCase(),
                                  )
                                  if (!fromAssetData || !toAssetData) return "0.00"
                                  const rate = fromAssetData.price / toAssetData.price
                                  return rate.toFixed(rate >= 100 ? 8 : rate < 0.01 ? 8 : 4)
                                })()} {swapToAsset.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span>Network Fee:</span>
                              <span className="text-green-300">Covered by Launchtube</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Slippage Tolerance:</span>
                              <span>0.5%</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={handleSwap}
                          disabled={swapLoading || !swapAmount || !swapEstimate}
                          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {swapLoading ? "Processing..." : "Swap Now"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>

                  {/* Changed to Link instead of Dialog */}
                  <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white sm:px-3" asChild>
                    <Link href="/send">
                      <ArrowRight className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">Send</span>
                    </Link>
                  </Button>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="bg-purple-700 hover:bg-purple-800 text-white sm:px-3">
                        <ArrowDown className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Receive</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800 text-white">
                      <DialogHeader>
                        <DialogTitle>Receive Assets</DialogTitle>
                        <DialogDescription className="text-gray-400">
                          Share your address to receive digital assets from others.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                          <Label htmlFor="receive-asset" className="text-white">
                            Select Asset
                          </Label>
                          <select className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-white ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                            {assets.map((asset) => (
                              <option key={`receive-${asset.symbol}`} value={asset.symbol.toLowerCase()}>
                                {asset.symbol} ({asset.name})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="mt-2">
                          <Label className="text-sm font-medium text-gray-300 mb-2 block">Your Wallet Address</Label>
                          <div className="bg-gray-800 rounded-md p-3 border border-gray-700">
                            <div className="flex items-center justify-between">
                              <div className="overflow-hidden">
                                <code className="text-sm text-gray-300 font-mono">
                                  {truncateAddress(walletAddress)}
                                </code>
                              </div>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => copyToClipboard(walletAddress)}
                                className="h-8 px-2 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 flex-shrink-0 ml-2"
                              >
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                <span className="sr-only">Copy address</span>
                              </Button>
                            </div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">Click to copy full address</p>
                        </div>

                        <div className="mt-2">
                          <div className="bg-green-900/20 border border-green-700 rounded-md p-3 text-sm text-green-300">
                            <p className="font-medium mb-1">Important:</p>
                            <ul className="list-disc pl-5 space-y-1">
                              <li>Only send {assets[0].symbol} to this address</li>
                              <li>Transactions typically complete in under 5 seconds</li>
                              <li>No gas fees required for receiving assets</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                          Download QR Code
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Search assets..."
                  value={searchAsset}
                  onChange={(e) => setSearchAsset(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredAssets.map((asset) => (
                  <div
                    key={asset.symbol}
                    className={`flex items-center justify-between rounded-xl border ${asset.borderColor} p-4 transition-colors ${asset.hoverBg}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-16 w-16 rounded-full ${asset.color} flex items-center justify-center`}>
                        <span className="font-semibold text-white text-xl">{asset.symbol}</span>
                      </div>
                      <div>
                        <div className="font-medium text-white text-lg">{asset.name}</div>
                        <div className="text-sm text-gray-400">
                          $
                          {asset.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{" "}
                          per {asset.symbol}
                        </div>
                        <div
                          className={`text-xs mt-1 ${asset.change > 0 ? "text-cyan-400" : asset.change < 0 ? "text-red-400" : "text-gray-400"}`}
                        >
                          {asset.change > 0 ? "+" : ""}
                          {asset.change}% (24h)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-white text-xl">
                        {asset.amount.toLocaleString(undefined, {
                          minimumFractionDigits: asset.price >= 100 ? 4 : 2,
                          maximumFractionDigits: asset.price >= 100 ? 4 : 2,
                        })}{" "}
                        {asset.symbol}
                      </div>
                      <div className="text-sm text-gray-400">
                        $
                        {(asset.price * asset.amount).toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </div>
                      <div className="mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
                        >
                          Details
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-0 shadow-md overflow-hidden bg-gray-900 border-gray-800">
              <CardHeader className="pb-2 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Recent Transactions</CardTitle>
                    <CardDescription className="text-gray-400">Your latest activity</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="gap-1 text-blue-400 hover:text-blue-300 hover:bg-blue-900/20"
                  >
                    <Link href="/transactions">
                      View All
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {transactions.map((tx, index) => (
                    <div key={index} className="flex items-center justify-between rounded-lg p-3 hover:bg-gray-800 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-full ${
                          tx.type === 'buy' ? 'bg-blue-600' :
                          tx.type === 'send' ? 'bg-purple-600' :
                          'bg-green-600'
                        } flex items-center justify-center`}>
                          {tx.type === 'buy' ? <Plus className="h-5 w-5 text-white" /> :
                           tx.type === 'send' ? <ArrowRight className="h-5 w-5 text-white" /> :
                           <ArrowDown className="h-5 w-5 text-white" />}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {tx.type === 'buy' ? 'Bought' :
                             tx.type === 'send' ? 'Sent' :
                             'Received'} {tx.asset}
                          </div>
                          <div className="text-sm text-gray-400">
                            {tx.date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-medium ${
                          tx.type === 'buy' || tx.type === 'receive' ? 'text-cyan-400' : 'text-red-400'
                        }`}>
                          {tx.type === 'buy' || tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.asset}
                        </div>
                        <div className="text-sm text-gray-400">
                          ${tx.usdValue.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md overflow-hidden bg-gray-900 border-gray-800">
              <CardHeader className="pb-2 text-white">
                <CardTitle>Market Overview</CardTitle>
                <CardDescription className="text-gray-400">Current market conditions</CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-medium text-gray-300">Portfolio Performance</h4>
                    <select
                      className="text-xs bg-gray-800 border border-gray-700 rounded px-2 py-1 text-gray-300"
                      defaultValue="1m"
                    >
                      <option value="1w">1W</option>
                      <option value="1m">1M</option>
                      <option value="3m">3M</option>
                      <option value="1y">1Y</option>
                      <option value="all">All</option>
                    </select>
                  </div>
                  <div className="h-[180px] w-full relative">
                    {/* Simple chart visualization */}
                    <div className="absolute bottom-0 left-0 right-0 h-[150px] overflow-hidden">
                      {/* Chart line - using a gradient background and a clip-path for a simple chart effect */}
                      <div
                        className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-transparent"
                        style={{
                          clipPath:
                            "polygon(0% 100%, 5% 85%, 10% 80%, 15% 85%, 20% 75%, 25% 80%, 30% 70%, 35% 65%, 40% 60%, 45% 50%, 50% 55%, 55% 45%, 60% 40%, 65% 35%, 70% 30%, 75% 25%, 80% 30%, 85% 20%, 90% 15%, 95% 10%, 100% 5%, 100% 100%)",
                        }}
                      ></div>
                      <div
                        className="absolute inset-0 border-t border-blue-500"
                        style={{
                          clipPath:
                            "polygon(0% 85%, 5% 85%, 10% 80%, 15% 85%, 20% 75%, 25% 80%, 30% 70%, 35% 65%, 40% 60%, 45% 50%, 50% 55%, 55% 45%, 60% 40%, 65% 35%, 70% 30%, 75% 25%, 80% 30%, 85% 20%, 90% 15%, 95% 10%, 100% 5%)",
                        }}
                      ></div>
                    </div>
                    {/* X-axis labels */}
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-gray-500 px-2">
                      <span>Apr 10</span>
                      <span>Apr 17</span>
                      <span>Apr 24</span>
                      <span>May 1</span>
                      <span>May 8</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-sm text-gray-300">
                      <span className="text-cyan-400">+12.4%</span> past month
                    </div>
                    <div className="text-sm text-gray-300">
                      $
                      <span className="text-white font-medium">
                        {totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-medium text-gray-300">Top Assets</h4>
                  {assets.slice(0, 4).map((asset) => (
                    <div key={`market-${asset.symbol}`} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${asset.color} flex items-center justify-center`}>
                          <span className="font-semibold text-white text-xs">{asset.symbol}</span>
                        </div>
                        <div className="font-medium text-white">{asset.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-white">
                          $
                          {asset.price.toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div
                          className={`text-xs ${asset.change > 0 ? "text-cyan-400" : asset.change < 0 ? "text-red-400" : "text-gray-400"}`}
                        >
                          {asset.change > 0 ? "+" : ""}
                          {asset.change}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
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