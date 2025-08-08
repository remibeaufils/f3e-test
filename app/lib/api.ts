const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

interface ApiOptions extends RequestInit {
    token?: string | null
}

export async function apiCall(endpoint: string, options: ApiOptions = {}) {
    const { token, headers = {}, ...restOptions } = options

    const url = `${API_BASE_URL}${endpoint}`

    const finalHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
    }

    // Add authorization header if token is provided
    if (token) {
        finalHeaders['Authorization'] = `Bearer ${token}`
        console.log('Token:', token)
    }

    try {
        console.log('Fetching URL:', url)
        console.log('Fetching URL:', restOptions)
        console.log('Fetching URL:', finalHeaders)
        const response = await fetch(url, {
            ...restOptions,
            headers: finalHeaders,
        })

        if (!response.ok) {
            const errorData = await response.text()
            throw new Error(`API Error: ${response.status} - ${errorData}`)
        }

        // Check if response has content
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
            return await response.json()
        }

        return await response.text()
    } catch (error) {
        console.error('API call failed:', error)
        throw error
    }
}

// Convenience methods
export const api = {
    get: (endpoint: string, token?: string | null) =>
        apiCall(endpoint, { method: 'GET', token }),

    post: (endpoint: string, data: unknown, token?: string | null) =>
        apiCall(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
            token
        }),

    put: (endpoint: string, data: unknown, token?: string | null) =>
        apiCall(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
            token
        }),

    delete: (endpoint: string, token?: string | null) =>
        apiCall(endpoint, { method: 'DELETE', token }),
}

// Specific API functions
export const getActiveDeals = async (token: string | null) => {
    const deals = await api.get('/v1/deals', token)
    return deals.filter((deal: any) => deal.is_active === true)
}

export const getDealDetails = async (dealId: string, token: string | null) => {
    return await api.get(`/v1/deals/${dealId}`, token)
}

export const getWaterfallConfig = async (dealId: string, token: string | null) => {
    return await api.get(`/v1/deals/${dealId}/waterfall-config`, token)
} 