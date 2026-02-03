"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { auth, chains as chainsApi, wallets as walletsApi, webhooks as webhooksApi, gas as gasApi, tokens as tokensApi } from "./api"

// Project & API Keys
export function useApiKeys(projectId: string) {
  return useQuery({
    queryKey: ["api-keys", projectId],
    queryFn: () => auth.listKeys(projectId),
    enabled: !!projectId,
  })
}

export function useCreateApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: auth.createKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  })
}

export function useDeleteApiKey() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: auth.deleteKey,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["api-keys"] }),
  })
}

// Chains
export function useChains() {
  return useQuery({
    queryKey: ["chains"],
    queryFn: chainsApi.list,
    staleTime: 60 * 60 * 1000, // 1 hour
  })
}

export function useChain(chain: string) {
  return useQuery({
    queryKey: ["chain", chain],
    queryFn: () => chainsApi.get(chain),
    enabled: !!chain,
  })
}

// Wallets
export function useWallets() {
  return useQuery({
    queryKey: ["wallets"],
    queryFn: walletsApi.list,
  })
}

export function useWallet(address: string) {
  return useQuery({
    queryKey: ["wallet", address],
    queryFn: () => walletsApi.get(address),
    enabled: !!address,
  })
}

export function useCreateWallet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: walletsApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wallets"] }),
  })
}

// Webhooks
export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: webhooksApi.list,
  })
}

export function useCreateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: webhooksApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  })
}

export function useUpdateWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Parameters<typeof webhooksApi.update>[1]) =>
      webhooksApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  })
}

export function useDeleteWebhook() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: webhooksApi.delete,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  })
}

export function useTestWebhook() {
  return useMutation({ mutationFn: webhooksApi.test })
}

export function useWebhookDeliveries(id: string) {
  return useQuery({
    queryKey: ["webhook-deliveries", id],
    queryFn: () => webhooksApi.deliveries(id),
    enabled: !!id,
  })
}

// Gas
export function useGasPrices(chain: string) {
  return useQuery({
    queryKey: ["gas-prices", chain],
    queryFn: () => gasApi.prices(chain),
    enabled: !!chain,
    refetchInterval: 15_000, // refresh every 15s
  })
}

export function useGasPolicies() {
  return useQuery({
    queryKey: ["gas-policies"],
    queryFn: gasApi.listPolicies,
  })
}

export function useCreateGasPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: gasApi.createPolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gas-policies"] }),
  })
}

export function useDeleteGasPolicy() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: gasApi.deletePolicy,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["gas-policies"] }),
  })
}

// Tokens
export function useTokenBalances(chain: string, address: string) {
  return useQuery({
    queryKey: ["token-balances", chain, address],
    queryFn: () => tokensApi.balances(chain, address),
    enabled: !!chain && !!address,
  })
}
