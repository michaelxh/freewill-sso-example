const express = require('express')
const { auth } = require('express-oauth2-jwt-bearer')
const cors = require('cors')
const app = express()
const port = 3000

// CORS middleware configuration
app.use(cors())

// Middleware to parse JSON bodies
app.use(express.json())

// Auth0 JWT middleware configuration
const checkJwt = auth({
  audience: 'https://firms.getestately.com/',
  issuer: 'https://estately-development.us.auth0.com/',
  jwksUri: 'https://estately-development.us.auth0.com/.well-known/jwks.json'
})

// Public route (no authentication required)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to FreeWill SSO API',
    status: 'public',
    timestamp: new Date().toISOString()
  })
})

// Protected route (authentication required)
app.get('/protected', checkJwt, (req, res) => {
  res.json({
    message: 'This is a protected route!',
    status: 'authenticated',
    user: req.auth?.payload,
    timestamp: new Date().toISOString()
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('API Error:', err)

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid or missing token',
      details: err.message
    })
  }

  if (err.name === 'InvalidTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: 'The provided token is invalid',
      details: err.message
    })
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: 'The provided token has expired',
      details: err.message
    })
  }

  // Generic error handler
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong',
    details: err.message
  })
})

app.listen(port, () => {
  console.log(`FreeWill SSO API listening on port ${port}`)
  console.log(`CORS enabled for origins: http://localhost:5173, http://localhost:3000, etc.`)
  console.log(`Public endpoint: http://localhost:${port}/`)
  console.log(`Protected endpoint: http://localhost:${port}/protected`)
})
