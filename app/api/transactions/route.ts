import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { fromPublicKey, toPublicKey, amount, asset } = await request.json()

    // Validate the request
    if (!fromPublicKey || !toPublicKey || !amount || !asset) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Execute the transaction using Launchtube for gasless operations
    const transactionId = await executeTransaction(fromPublicKey, toPublicKey, amount, asset)

    return NextResponse.json({
      success: true,
      transactionId,
    })
  } catch (error) {
    console.error("Transaction error:", error)
    return NextResponse.json({ success: false, error: "Transaction failed" }, { status: 400 })
  }
}
