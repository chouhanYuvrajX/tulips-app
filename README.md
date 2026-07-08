# tulips-app

## Backend API Authentication
The `/api/chat` and `/audio/:id` routes are protected by a lightweight shared-secret check.
When making requests to these routes from the frontend, you must include the `x-api-secret` header with the value of `BACKEND_API_SECRET`.

Example:
```
headers: {
  'Content-Type': 'application/json',
  'x-api-secret': 'your_backend_api_secret_here'
}
```
