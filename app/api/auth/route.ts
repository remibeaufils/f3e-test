import { NextResponse } from 'next/server'

export async function POST() {
    try {
        // Get credentials from environment variables
        const username = process.env.API_USERNAME
        const password = process.env.API_PASSWORD
        const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

        if (!username || !password) {
            return NextResponse.json(
                { error: 'Server configuration error: Missing credentials' },
                { status: 500 }
            )
        }

        // Prepare form data
        const formData = new URLSearchParams()
        formData.append('grant_type', 'password')
        formData.append('username', username)
        formData.append('password', password)
        formData.append('scope', '')
        formData.append('client_id', '')
        formData.append('client_secret', '')

        // Make request to external API
        const response = await fetch(`${baseUrl}/v1/login/access-token`, {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formData.toString(),
        })

        if (!response.ok) {
            const errorData = await response.text()
            return NextResponse.json(
                { error: 'Authentication failed', details: errorData },
                { status: response.status }
            )
        }

        const data = await response.json()

        // Return the token to the client
        return NextResponse.json({
            access_token: data.access_token,
            token_type: data.token_type || 'bearer'
        })
    } catch (error) {
        console.error('Authentication error:', error)
        return NextResponse.json(
            { error: 'Internal server error during authentication' },
            { status: 500 }
        )
    }
} 