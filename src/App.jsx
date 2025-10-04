// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Public pages
import HomePage from "./pages/HomePage";
import ConfiguratorPage from "./pages/ConfiguratorPage";
import VariantDetailPage from "./pages/VariantDetailPage";
import RtoSelectionPage from "./pages/RtoSelectionPage";
import InsuranceSelectionPage from "./pages/InsuranceSelectionPage";
import AccessoriesPage from "./pages/AccessoriesPage";
import SummaryPage from "./pages/SummaryPage";

// Admin pages
import AdminPanel from "./pages/AdminPanel";
import ManageAccessories from "./pages/admin/ManageAccessories";
import ManageCars from "./pages/admin/ManageCars";
import ManageInsurance from "./pages/admin/ManageInsurance"; // ⬅️ Combined tabs page
import ManageRto from "./pages/admin/ManageRto";
import ManageSchemes from "./pages/admin/ManageSchemes";
import ManageUsers from "./pages/admin/ManageUsers";
import ManageVariantContent from "./pages/admin/ManageVariantContent";
import ManageVariants from "./pages/admin/ManageVariants";
import ManagePermissions from "./pages/admin/ManagePermissions";
import AdminLogin from "./pages/AdminLogin";

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/configurator" element={<ConfiguratorPage />} />
        <Route path="/variant/:variantId" element={<VariantDetailPage />} />
        <Route path="/rto/:variantId" element={<RtoSelectionPage />} />
        <Route path="/insurance/:variantId" element={<InsuranceSelectionPage />} />
        <Route path="/accessories/:carId" element={<AccessoriesPage />} />
        <Route path="/summary/:variantId" element={<SummaryPage />} />

        {/* Admin routes */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminPanel />}>
          <Route path="accessories" element={<ManageAccessories />} />
          <Route path="cars" element={<ManageCars />} />
          <Route path="insurance" element={<ManageInsurance />} /> {/* ⬅️ Combined tabbed insurance */}
          <Route path="rto" element={<ManageRto />} />
          <Route path="schemes" element={<ManageSchemes />} />
          <Route path="users" element={<ManageUsers />} />
          <Route path="variant-content" element={<ManageVariantContent />} />
          <Route path="variants" element={<ManageVariants />} />
          <Route path="permissions" element={<ManagePermissions />} />
        </Route>
      </Routes>
    </Router>
  );
}
