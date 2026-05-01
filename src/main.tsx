import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import { OfflineBanner } from './components/OfflineBanner'
import CreateTrip from './pages/CreateTrip'
import Landing from './pages/Landing'
import NotFound from './pages/NotFound'
import TripSafetyPage from './pages/TripSafetyPage'
import './index.css'

const router = createBrowserRouter([
  { path: '/', element: <Landing />, errorElement: <NotFound /> },
  { path: '/create', element: <CreateTrip />, errorElement: <NotFound /> },
  {
    path: '/trip/:shareCode',
    element: <TripSafetyPage />,
    errorElement: <NotFound />,
  },
  { path: '*', element: <NotFound /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <OfflineBanner />
    <RouterProvider router={router} />
  </StrictMode>,
)
