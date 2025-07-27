import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import Navigation from "./components/layout/Navigation";
import Dashboard from "./pages/Dashboard";
import Events from "./pages/Events";
import CreateEvent from "./pages/CreateEvent";
import CrossedPaths from "./pages/CrossedPaths";
import Feedback from "./pages/Feedback";
import Profile from "./pages/Profile";
import Subscription from "./pages/Subscription";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminCreateEvent from "./pages/admin/AdminCreateEvent";
import AdminEditEvent from "./pages/admin/AdminEditEvent";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminCrossedPaths from "./pages/admin/AdminCrossedPaths";
import AdminRSVPs from "./pages/admin/AdminRSVPs";
import AdminReservations from "./pages/admin/AdminReservations";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminNotifications from "./pages/admin/AdminNotifications";
import AdminReports from "./pages/admin/AdminReports";
import AdminManagement from "./pages/admin/AdminManagement";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminLayout from "./components/layout/AdminLayout";
import ExploreEvents from "./pages/ExploreEvents";
import TestAuthSystem from "./components/auth/TestAuthSystem";
import RoleDebugger from "./components/auth/RoleDebugger";
import UserDashboard from "./pages/UserDashboard";
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import NotFound from "./pages/NotFound";
import RSVPs from "./pages/RSVPs";
import EventDetails from "./pages/EventDetails";
import EventEdit from "./pages/EventEdit";
import Restaurants from "./pages/Restaurants";
import AddRestaurant from "./pages/AddRestaurant";
import EditRestaurant from "./pages/EditRestaurant";
import MyVisits from "./pages/MyVisits";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground">
            <Routes>
              <Route path="/auth" element={<div>Auth page rendered by ProtectedRoute</div>} />
              <Route path="/" element={
                <ProtectedRoute>
                  <Navigation />
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/events" element={
                <ProtectedRoute>
                  <Navigation />
                  <Events />
                </ProtectedRoute>
              } />
              <Route path="/create-event" element={
                <ProtectedRoute>
                  <Navigation />
                  <CreateEvent />
                </ProtectedRoute>
              } />
              <Route path="/explore" element={
                <>
                  <Navigation />
                  <ExploreEvents />
                </>
              } />
              <Route path="/rsvps" element={
                <ProtectedRoute>
                  <Navigation />
                  <RSVPs />
                </ProtectedRoute>
              } />
              <Route path="/event/:eventId/details" element={
                <>
                  <Navigation />
                  <EventDetails />
                </>
              } />
              <Route path="/event/:eventId/edit" element={
                <ProtectedRoute>
                  <Navigation />
                  <EventEdit />
                </ProtectedRoute>
              } />
              <Route path="/restaurants" element={
                <ProtectedRoute>
                  <Navigation />
                  <Restaurants />
                </ProtectedRoute>
              } />
              <Route path="/restaurants/add" element={
                <ProtectedRoute>
                  <Navigation />
                  <AddRestaurant />
                </ProtectedRoute>
              } />
              <Route path="/restaurants/edit/:id" element={
                <ProtectedRoute>
                  <Navigation />
                  <EditRestaurant />
                </ProtectedRoute>
              } />
              <Route path="/crossed-paths" element={
                <ProtectedRoute>
                  <Navigation />
                  <CrossedPaths />
                </ProtectedRoute>
              } />
              <Route path="/my-visits" element={
                <ProtectedRoute>
                  <Navigation />
                  <MyVisits />
                </ProtectedRoute>
              } />
              <Route path="/feedback" element={
                <ProtectedRoute>
                  <Navigation />
                  <Feedback />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Navigation />
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/subscription" element={
                <ProtectedRoute>
                  <Navigation />
                  <Subscription />
                </ProtectedRoute>
              } />
              <Route path="/user/dashboard" element={
                <ProtectedRoute>
                  <Navigation />
                  <UserDashboard />
                </ProtectedRoute>
              } />
              <Route path="/superadmin/dashboard" element={
                <ProtectedAdminRoute requireSuperAdmin={true}>
                  <SuperAdminDashboard />
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/dashboard" element={
                <ProtectedAdminRoute requireSuperAdmin={false}>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/events" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminEvents />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminDashboard />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route
                path="/admin/events/create"
                element={
                  <ProtectedAdminRoute>
                    <AdminCreateEvent />
                  </ProtectedAdminRoute>
                }
              />
              <Route
                path="/admin/events/edit/:id"
                element={
                  <ProtectedAdminRoute>
                    <AdminEditEvent />
                  </ProtectedAdminRoute>
                }
              />
              <Route path="/admin/users" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminUsers />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/crossed-paths" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminCrossedPaths />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/rsvps" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminRSVPs />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/reservations" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminReservations />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/analytics" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminAnalytics />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/notifications" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminNotifications />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AdminReports />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/admin-management" element={
                <ProtectedAdminRoute requireSuperAdmin={true}>
                  <AdminLayout>
                    <AdminManagement />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/settings" element={
                <ProtectedAdminRoute requireSuperAdmin={true}>
                  <AdminLayout>
                    <AdminSettings />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/restaurants" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <Restaurants />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/restaurants/add" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <AddRestaurant />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/admin/restaurants/edit/:id" element={
                <ProtectedAdminRoute>
                  <AdminLayout>
                    <EditRestaurant />
                  </AdminLayout>
                </ProtectedAdminRoute>
              } />
              <Route path="/test-auth" element={
                <TestAuthSystem />
              } />
              <Route path="/debug-role" element={
                <RoleDebugger />
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
