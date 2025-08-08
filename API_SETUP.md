# API Authentication Setup

This application connects to an API at `localhost:8000` and uses bearer token authentication.

## Environment Variables

Create a `.env.local` file in the root of your project with the following variables:

```env
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
API_USERNAME=your_username_here
API_PASSWORD=your_password_here
```

**Important**: 
- Never commit `.env.local` to version control
- Replace `your_username_here` and `your_password_here` with your actual credentials
- The `API_USERNAME` and `API_PASSWORD` are kept server-side only and never exposed to the client

## How It Works

1. **Authentication Flow**:
   - When the app loads, it automatically attempts to authenticate
   - The authentication request is made from the Next.js API route (`/api/auth`)
   - Credentials are read from environment variables on the server
   - The bearer token is returned to the client and stored in React Context

2. **Security Features**:
   - Credentials are never exposed to the client-side code
   - All authentication happens through a secure server-side API route
   - The bearer token is stored in memory (React Context) and cleared on logout
   - API calls can use the token from context for authenticated requests

3. **API Integration**:
   - Use the `api` helper from `app/lib/api.ts` for making authenticated requests
   - Example: `api.get('/v1/some-endpoint', auth.access_token)`

## Testing

1. Make sure your API is running at `http://localhost:8000`
2. Ensure the `/v1/login/access-token` endpoint is available
3. Set up your environment variables
4. Start the Next.js app: `npm run dev`
5. The app will automatically authenticate when you access it

## Error Handling

If authentication fails:
- An error message will be displayed
- You can retry authentication by clicking the "Retry Authentication" button
- Check your environment variables and API connection 