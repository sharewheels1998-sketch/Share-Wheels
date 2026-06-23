import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Users from "./pages/Users";
import Rides from "./pages/Rides";
import PassengerRides from "./pages/PassengerRides";
import Couriers from "./pages/Couriers";
import LiveTracking from "./pages/LiveTracking";
import Ads from "./pages/Ads";
import Locations from "./pages/Locations";
import LookupTypes from "./pages/LookupTypes";
import Feedbacks from "./pages/Feedbacks";
import LegalPolicies from "./pages/LegalPolicies";
import SubscriptionPlans from "./pages/SubscriptionPlans";
import SubscribedUsers from "./pages/SubscribedUsers";
import SubscriptionPayments from "./pages/SubscriptionPayments";
import VehicleFarePricing from "./pages/VehicleFarePricing";
import AdminStaff from "./pages/AdminStaff";
import { PermissionRoute } from "./components/PermissionGate";
import { ROUTE_MODULE_MAP } from "./constants/adminPermissions";

const isAuthed = () => !!localStorage.getItem("adminToken");

const ProtectedRoute = ({ children }) =>
  isAuthed() ? children : <Navigate to="/login" replace />;

const ModuleRoute = ({ path, element }) => {
  const module = ROUTE_MODULE_MAP[path];
  if (!module) return element;
  return <PermissionRoute module={module}>{element}</PermissionRoute>;
};

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<ModuleRoute path="/" element={<Dashboard />} />} />
        <Route path="users" element={<ModuleRoute path="/users" element={<Users />} />} />
        <Route path="rides" element={<ModuleRoute path="/rides" element={<Rides />} />} />
        <Route
          path="passenger-rides"
          element={<ModuleRoute path="/passenger-rides" element={<PassengerRides />} />}
        />
        <Route path="couriers" element={<ModuleRoute path="/couriers" element={<Couriers />} />} />
        <Route
          path="live-tracking"
          element={<ModuleRoute path="/live-tracking" element={<LiveTracking />} />}
        />
        <Route path="ads" element={<ModuleRoute path="/ads" element={<Ads />} />} />
        <Route path="locations" element={<ModuleRoute path="/locations" element={<Locations />} />} />
        <Route
          path="lookup-types"
          element={<ModuleRoute path="/lookup-types" element={<LookupTypes />} />}
        />
        <Route path="feedback" element={<ModuleRoute path="/feedback" element={<Feedbacks />} />} />
        <Route path="legal" element={<ModuleRoute path="/legal" element={<LegalPolicies />} />} />
        <Route
          path="subscription-plans"
          element={<ModuleRoute path="/subscription-plans" element={<SubscriptionPlans />} />}
        />
        <Route
          path="subscribed-users"
          element={<ModuleRoute path="/subscribed-users" element={<SubscribedUsers />} />}
        />
        <Route
          path="subscription-payments"
          element={<ModuleRoute path="/subscription-payments" element={<SubscriptionPayments />} />}
        />
        <Route
          path="vehicle-fares"
          element={<ModuleRoute path="/vehicle-fares" element={<VehicleFarePricing />} />}
        />
        <Route
          path="admin-staff"
          element={<ModuleRoute path="/admin-staff" element={<AdminStaff />} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
