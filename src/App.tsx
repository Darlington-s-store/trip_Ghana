import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { PublicLayout } from "@/components/layouts/PublicLayout";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { AdminLayout } from "@/components/layouts/AdminLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Destinations from "./pages/destinations/Destinations";
import DestinationDetail from "./pages/destinations/DestinationDetail";
import Hotels from "./pages/hotels/Hotels";
import HotelDetail from "./pages/hotels/HotelDetail";
import Attractions from "./pages/attractions/Attractions";
import AttractionDetail from "./pages/attractions/AttractionDetail";
import About from "./pages/About";
import Contact from "./pages/Contact";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";
import AdminLogin from "./pages/auth/AdminLogin";

import DashboardOverview from "./pages/dashboard/DashboardOverview";
import MyBookings from "./pages/dashboard/MyBookings";
import MyTrips from "./pages/dashboard/MyTrips";
import Notifications from "./pages/dashboard/Notifications";
import Profile from "./pages/dashboard/Profile";
import DashboardSettings from "./pages/dashboard/DashboardSettings";

import AdminOverview from "./pages/admin/AdminOverview";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageHotels from "./pages/admin/ManageHotels";
import ManageBookings from "./pages/admin/ManageBookings";
import ManageDestinations from "./pages/admin/ManageDestinations";
import ManageAttractions from "./pages/admin/ManageAttractions";
import ManageTrips from "./pages/admin/ManageTrips";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import ApiExplorer from "./pages/admin/ApiExplorer";
import AdminSettings from "./pages/admin/AdminSettings";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/destinations" element={<Destinations />} />
            <Route path="/destinations/:slug" element={<DestinationDetail />} />
            <Route path="/hotels" element={<Hotels />} />
            <Route path="/hotels/:id" element={<HotelDetail />} />
            <Route path="/attractions" element={<Attractions />} />
            <Route path="/attractions/:id" element={<AttractionDetail />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
          </Route>

          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin/login" element={<AdminLogin />} />

          {/* User dashboard */}
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<DashboardOverview />} />
            <Route path="bookings" element={<MyBookings />} />
            <Route path="trips" element={<MyTrips />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<DashboardSettings />} />
          </Route>

          {/* Admin dashboard */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminOverview />} />
            <Route path="users" element={<ManageUsers />} />
            <Route path="hotels" element={<ManageHotels />} />
            <Route path="bookings" element={<ManageBookings />} />
            <Route path="trips" element={<ManageTrips />} />
            <Route path="destinations" element={<ManageDestinations />} />
            <Route path="attractions" element={<ManageAttractions />} />
            <Route path="analytics" element={<AdminAnalytics />} />
            <Route path="api-strategy" element={<ApiExplorer />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
