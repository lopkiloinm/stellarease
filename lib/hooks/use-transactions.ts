import { useState, useEffect } from 'react'

export interface SmartContractTransaction {
  txhash: string
  timestamp: string
  successful: boolean
  operation: {
    type: 'add_signer' | 'remove_signer' | 'update_signer' | 'transfer' | 'contract_call'
    details: {
      signerType?: 'Policy' | 'Ed25519' | 'Secp256r1'
      signerKey?: string
      amount?: string
      asset?: string
      to?: string
      from?: string
      contractAddress?: string
      functionName?: string
      args?: any[]
    }
  }
}

export interface Pagination {
  total: number
  limit: number
  offset: number
}

export interface UseTransactionsOptions {
  contractId?: string
  limit?: number
  offset?: number
  onError?: (error: Error) => void
}

export function useTransactions({
  contractId,
  limit = 20,
  offset = 0,
  onError
}: UseTransactionsOptions = {}) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [transactions, setTransactions] = useState<SmartContractTransaction[]>([])
  const [pagination, setPagination] = useState<Pagination>({
    total: 0,
    limit,
    offset
  })

  const fetchTransactions = async (newOffset = offset) => {
    if (!contractId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/mercury', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'get_smart_contract_transactions',
          contractId,
          limit,
          offset: newOffset
        })
      })

      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      if (newOffset === 0) {
        setTransactions(data.transactions)
      } else {
        setTransactions(prev => [...prev, ...data.transactions])
      }

      setPagination({
        total: data.pagination.total,
        limit: data.pagination.limit,
        offset: data.pagination.offset
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('An error occurred')
      setError(error)
      onError?.(error)
    } finally {
      setLoading(false)
    }
  }

  const loadMore = () => {
    if (loading || transactions.length >= pagination.total) return
    fetchTransactions(pagination.offset + pagination.limit)
  }

  const refresh = () => {
    fetchTransactions(0)
  }

  useEffect(() => {
    if (contractId) {
      fetchTransactions()
    }
  }, [contractId])

  return {
    loading,
    error,
    transactions,
    pagination,
    loadMore,
    refresh
  }
} 