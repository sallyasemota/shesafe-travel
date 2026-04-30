import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import LandingPage from './pages/LandingPage'
import TripSafetyPage from './pages/TripSafetyPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <LandingPage /> },
  { path: '/trip/:shareCode', element: <TripSafetyPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
