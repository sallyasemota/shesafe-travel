import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { OfflineBanner } from './components/OfflineBanner'
import CreateTrip from './pages/CreateTrip'
import Landing from './pages/Landing'
import TripSafetyPage from './pages/TripSafetyPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/create', element: <CreateTrip /> },
  { path: '/trip/:shareCode', element: <TripSafetyPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineBanner />
    <RouterProvider router={router} />
  </StrictMode>,
)
