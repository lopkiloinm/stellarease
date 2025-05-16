import { native } from '../common'

export async function getXlmBalance(address: string) {
  try {
    const { result } = await native.balance({ id: address })
    
    // Convert from stroops to XLM (1 XLM = 10^7 stroops)
    return (Number(result) / 10000000).toFixed(7)
  } catch (error) {
    console.error('Error fetching XLM balance:', error)
    return '0'
  }
} 