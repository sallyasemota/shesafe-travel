import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import CreateTrip from './pages/CreateTrip'
import TripSafetyPage from './pages/TripSafetyPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <CreateTrip /> },
  { path: '/trip/:shareCode', element: <TripSafetyPage /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
