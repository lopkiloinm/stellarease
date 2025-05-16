"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  Download,
  Filter,
  History,
  LogOut,
  Menu,
  Plus,
  Search,
  Settings,
  Wallet,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { useMobile } from "@/lib/hooks/use-mobile"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"

// Transaction type definition
type Transaction = {
  id: string
  type: "buy" | "sell" | "send" | "receive"
  asset: {
    symbol: string
    name: string
    color: string
  }
  amount: number
  value: number
  date: string
  status: "completed" | "pending" | "failed"
  address?: string
}

export default function TransactionsPage() {
  const isMobile = useMobile()
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null)
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Asset data
  const assets = [
    { symbol: "XLM", name: "Stellar Lumens", color: "bg-blue-600" },
    { symbol: "USDC", name: "USD Coin", color: "bg-cyan-600" },
    { symbol: "BTC", name: "Bitcoin", color: "bg-orange-600" },
    { symbol: "ETH", name: "Ethereum", color: "bg-indigo-600" },
    { symbol: "USDT", name: "Tether", color: "bg-green-600" },
    { symbol: "ALGO", name: "Algorand", color: "bg-purple-600" },
  ]

  // Sample transaction data
  const transactions: Transaction[] = [
    {
      id: "tx-1",
      type: "buy",
      asset: assets[0], // XLM
      amount: 50,
      value: 25,
      date: "May 8, 2025",
      status: "completed",
    },
    {
      id: "tx-2",
      type: "buy",
      asset: assets[2], // BTC
      amount: 0.005,
      value: 325,
      date: "May 7, 2025",
      status: "completed",
    },
    {
      id: "tx-3",
      type: "send",
      asset: assets[1], // USDC
      amount: 75,
      value: 75,
      date: "May 5, 2025",
      status: "completed",
      address: "GDPWK...X4ZQP",
    },
    {
      id: "tx-4",
      type: "buy",
      asset: assets[3], // ETH
      amount: 0.1,
      value: 350,
      date: "May 3, 2025",
      status: "completed",
    },
    {
      id: "tx-5",
      type: "buy",
      asset: assets[1], // USDC
      amount: 1200,
      value: 1200,
      date: "May 1, 2025",
      status: "completed",
    },
    {
      id: "tx-6",
      type: "receive",
      asset: assets[0], // XLM
      amount: 100,
      value: 50,
      date: "Apr 28, 2025",
      status: "completed",
      address: "GFXHS...P9QR",
    },
    {
      id: "tx-7",
      type: "sell",
      asset: assets[2], // BTC
      amount: 0.01,
      value: 650,
      date: "Apr 25, 2025",
      status: "completed",
    },
    {
      id: "tx-8",
      type: "send",
      asset: assets[3], // ETH
      amount: 0.05,
      value: 175,
      date: "Apr 22, 2025",
      status: "failed",
      address: "0x742d...3B21",
    },
    {
      id: "tx-9",
      type: "buy",
      asset: assets[5], // ALGO
      amount: 500,
      value: 375,
      date: "Apr 20, 2025",
      status: "completed",
    },
    {
      id: "tx-10",
      type: "receive",
      asset: assets[4], // USDT
      amount: 750,
      value: 750,
      date: "Apr 18, 2025",
      status: "completed",
      address: "GDHW9...K3LP",
    },
    {
      id: "tx-11",
      type: "buy",
      asset: assets[3], // ETH
      amount: 0.15,
      value: 525,
      date: "Apr 15, 2025",
      status: "pending",
    },
    {
      id: "tx-12",
      type: "send",
      asset: assets[0], // XLM
      amount: 200,
      value: 100,
      date: "Apr 12, 2025",
      status: "completed",
      address: "GDPWK...X4ZQP",
    },
  ]

  // Filter transactions
  const filteredTransactions = transactions.filter((tx) => {
    // Search query filter
    if (
      searchQuery &&
      !tx.asset.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.asset.symbol.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !tx.id.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false
    }

    // Transaction type filter
    if (selectedType && tx.type !== selectedType) {
      return false
    }

    // Asset filter
    if (selectedAsset && tx.asset.symbol !== selectedAsset) {
      return false
    }

    // Status filter
    if (selectedStatus && tx.status !== selectedStatus) {
      return false
    }

    // Date range filter (simplified for demo)
    if (selectedDateRange) {
      // This is a simplified check - in a real app, you'd parse dates and check ranges
      if (selectedDateRange === "last7days" && tx.date.includes("Apr")) {
        return false
      } else if (selectedDateRange === "last30days" && tx.date.includes("Mar")) {
        return false
      }
    }

    return true
  })

  // Pagination
  const itemsPerPage = 8
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Reset filters
  const resetFilters = () => {
    setSelectedType(null)
    setSelectedAsset(null)
    setSelectedStatus(null)
    setSelectedDateRange(null)
    setSearchQuery("")
  }

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "buy":
        return <Plus className="h-5 w-5 text-white" />
      case "sell":
        return <ArrowUp className="h-5 w-5 text-white" />
      case "send":
        return <ArrowRight className="h-5 w-5 text-white" />
      case "receive":
        return <ArrowDown className="h-5 w-5 text-white" />
      default:
        return <History className="h-5 w-5 text-white" />
    }
  }

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case "buy":
        return "bg-blue-600"
      case "sell":
        return "bg-orange-600"
      case "send":
        return "bg-purple-600"
      case "receive":
        return "bg-green-600"
      default:
        return "bg-gray-600"
    }
  }

  // Get transaction amount text color
  const getAmountColor = (type: string) => {
    switch (type) {
      case "buy":
      case "receive":
        return "text-cyan-400"
      case "sell":
      case "send":
        return "text-red-400"
      default:
        return "text-white"
    }
  }

  // Get transaction amount prefix
  const getAmountPrefix = (type: string) => {
    switch (type) {
      case "buy":
      case "receive":
        return "+"
      case "sell":
      case "send":
        return "-"
      default:
        return ""
    }
  }

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border-green-600/50">Completed</Badge>
        )
      case "pending":
        return (
          <Badge className="bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30 border-yellow-600/50">
            Pending
          </Badge>
        )
      case "failed":
        return <Badge className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border-red-600/50">Failed</Badge>
      default:
        return null
    }
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
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md hover:bg-gray-800 transition-colors"
                    >
                      <Wallet className="h-5 w-5 text-gray-300" />
                      Dashboard
                    </Link>
                    <Link
                      href="/transactions"
                      className="flex items-center gap-3 text-base font-medium py-2 px-3 rounded-md bg-blue-600"
                    >
                      <History className="h-5 w-5 text-white" />
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
                className="flex items-center gap-2 text-sm font-medium text-gray-400 hover:text-white transition-colors"
              >
                <Wallet className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/transactions"
                className="flex items-center gap-2 text-sm font-medium text-white border-b-2 border-blue-600 pb-[17px]"
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
              <h1 className="text-3xl font-bold">Transactions</h1>
              <p className="text-gray-400 mt-1">View and manage your transaction history</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="self-start sm:self-auto bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200"
              onClick={() => window.print()}
            >
              <Download className="h-4 w-4 mr-2" /> Export
            </Button>
          </div>

          <Card className="overflow-hidden border-0 shadow-md bg-gray-900 border-gray-800 mb-6">
            <CardHeader className="pb-2 bg-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl">Transaction History</CardTitle>
                  <CardDescription className="text-blue-100">
                    {filteredTransactions.length} transactions found
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="bg-blue-700 hover:bg-blue-800 text-white sm:px-3"
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    <Filter className="h-4 w-4 sm:mr-1" />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              {/* Search and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-4 py-2 border border-gray-700 rounded-md bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                {showFilters && (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <div>
                      <Label htmlFor="type-filter" className="text-sm text-gray-300 mb-1 block">
                        Transaction Type
                      </Label>
                      <Select value={selectedType || ""} onValueChange={(value) => setSelectedType(value || null)}>
                        <SelectTrigger id="type-filter" className="border-gray-700 bg-gray-800 text-white">
                          <SelectValue placeholder="All Types" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-gray-800 text-white">
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="buy">Buy</SelectItem>
                          <SelectItem value="sell">Sell</SelectItem>
                          <SelectItem value="send">Send</SelectItem>
                          <SelectItem value="receive">Receive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="asset-filter" className="text-sm text-gray-300 mb-1 block">
                        Asset
                      </Label>
                      <Select value={selectedAsset || ""} onValueChange={(value) => setSelectedAsset(value || null)}>
                        <SelectTrigger id="asset-filter" className="border-gray-700 bg-gray-800 text-white">
                          <SelectValue placeholder="All Assets" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-gray-800 text-white">
                          <SelectItem value="all">All Assets</SelectItem>
                          {assets.map((asset) => (
                            <SelectItem key={asset.symbol} value={asset.symbol}>
                              {asset.symbol} - {asset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="status-filter" className="text-sm text-gray-300 mb-1 block">
                        Status
                      </Label>
                      <Select value={selectedStatus || ""} onValueChange={(value) => setSelectedStatus(value || null)}>
                        <SelectTrigger id="status-filter" className="border-gray-700 bg-gray-800 text-white">
                          <SelectValue placeholder="All Statuses" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-gray-800 text-white">
                          <SelectItem value="all">All Statuses</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="failed">Failed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="date-filter" className="text-sm text-gray-300 mb-1 block">
                        Date Range
                      </Label>
                      <Select
                        value={selectedDateRange || ""}
                        onValueChange={(value) => setSelectedDateRange(value || null)}
                      >
                        <SelectTrigger id="date-filter" className="border-gray-700 bg-gray-800 text-white">
                          <SelectValue placeholder="All Time" />
                        </SelectTrigger>
                        <SelectContent className="border-gray-700 bg-gray-800 text-white">
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="last7days">Last 7 Days</SelectItem>
                          <SelectItem value="last30days">Last 30 Days</SelectItem>
                          <SelectItem value="last90days">Last 90 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="md:col-span-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-gray-800 border-gray-700 text-red-300 hover:bg-gray-700 hover:text-red-200"
                        onClick={resetFilters}
                      >
                        <X className="h-4 w-4 mr-1" /> Clear Filters
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Transactions List */}
              {paginatedTransactions.length > 0 ? (
                <div className="space-y-4">
                  {paginatedTransactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex flex-col md:flex-row md:items-center justify-between rounded-lg border border-gray-800 p-4 hover:bg-gray-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-4 mb-3 md:mb-0">
                        <div
                          className={`h-12 w-12 rounded-full ${getTransactionColor(
                            tx.type,
                          )} flex items-center justify-center`}
                        >
                          {getTransactionIcon(tx.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-white capitalize">
                              {tx.type === "buy"
                                ? "Bought"
                                : tx.type === "sell"
                                  ? "Sold"
                                  : tx.type === "send"
                                    ? "Sent"
                                    : "Received"}{" "}
                              {tx.asset.symbol}
                            </div>
                            {getStatusBadge(tx.status)}
                          </div>
                          <div className="text-sm text-gray-400 mt-1">
                            {tx.date} • ID: {tx.id}
                          </div>
                          {tx.address && (
                            <div className="text-xs text-gray-500 mt-1">
                              {tx.type === "send" ? "To: " : "From: "}
                              {tx.address}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className={`font-medium ${getAmountColor(tx.type)}`}>
                          {getAmountPrefix(tx.type)}
                          {tx.amount.toLocaleString(undefined, {
                            minimumFractionDigits: tx.amount < 1 ? 4 : 0,
                            maximumFractionDigits: tx.amount < 1 ? 4 : 0,
                          })}{" "}
                          {tx.asset.symbol}
                        </div>
                        <div className="text-sm text-gray-400">
                          ${tx.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200 h-8 px-3 text-xs"
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="h-16 w-16 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                    <History className="h-8 w-8 text-gray-500" />
                  </div>
                  <h3 className="text-lg font-medium text-white mb-2">No transactions found</h3>
                  <p className="text-gray-400 max-w-md mx-auto">
                    We couldn't find any transactions matching your filters. Try adjusting your search criteria or clear
                    the filters.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-4 bg-gray-800 border-gray-700 text-red-300 hover:bg-gray-700 hover:text-red-200"
                    onClick={resetFilters}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="border-t border-gray-800 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-400">
                Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
              </div>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200 disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-sm text-gray-300">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8 bg-gray-800 border-gray-700 text-blue-300 hover:bg-gray-700 hover:text-blue-200 disabled:opacity-50"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
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
