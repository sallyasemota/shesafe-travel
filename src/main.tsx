import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { OfflineBanner } from './components/OfflineBanner'
import CreateTrip from './pages/CreateTrip'
import Landing from './pages/Landing'
import MyTrips from './pages/MyTrips'
import NotFound from './pages/NotFound'
import TripSafetyPage, { TripErrorFallback } from './pages/TripSafetyPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Landing />, errorElement: <NotFound /> },
  { path: '/create', element: <CreateTrip />, errorElement: <NotFound /> },
  { path: '/my-trips', element: <MyTrips />, errorElement: <NotFound /> },
  {
    path: '/trip/:shareCode',
    element: <TripSafetyPage />,
    errorElement: <TripErrorFallback />,
  },
  { path: '*', element: <NotFound /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineBanner />
    <RouterProvider router={router} />
  </StrictMode>,
)
