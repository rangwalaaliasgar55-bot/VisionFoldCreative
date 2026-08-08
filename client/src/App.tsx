import { Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import HomePage from "./pages/HomePage";
import WorkPage from "./pages/WorkPage";
import ServicesPage from "./pages/ServicesPage";
import ContactPage from "./pages/ContactPage";
import AboutPage from "./pages/AboutPage";
import PricingPage from "./pages/PricingPage";
import LoginPage from "./pages/LoginPage";
import PortalLayout from "./components/portal/PortalLayout";
import PortalDashboard from "./pages/portal/Dashboard";
import PortalProjects from "./pages/portal/Projects";
import PortalMessages from "./pages/portal/Messages";
import PortalInvoices from "./pages/portal/Invoices";
import PortalSettings from "./pages/portal/Settings";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProjects from "./pages/admin/AdminProjects";
import AdminClients from "./pages/admin/AdminClients";
import AdminInvoices from "./pages/admin/AdminInvoices";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminMessages from "./pages/admin/AdminMessages";
import AdminAI from "./pages/admin/AdminAI";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOutreach from "./pages/admin/AdminOutreach";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return null;
}

export default function App() {
  return (
    <div className="relative bg-void min-h-screen noise-bg">
      <ScrollToTop />
      <Routes>
        <Route element={<><Navigation /><Footer /></>}>
          <Route path="/" element={<HomePage />} />
          <Route path="/work" element={<WorkPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/pricing" element={<PricingPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />

        <Route path="/portal" element={<PortalLayout />}>
          <Route index element={<PortalDashboard />} />
          <Route path="projects" element={<PortalProjects />} />
          <Route path="messages" element={<PortalMessages />} />
          <Route path="invoices" element={<PortalInvoices />} />
          <Route path="settings" element={<PortalSettings />} />
        </Route>

        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="projects" element={<AdminProjects />} />
          <Route path="clients" element={<AdminClients />} />
          <Route path="invoices" element={<AdminInvoices />} />
          <Route path="media" element={<AdminMedia />} />
          <Route path="messages" element={<AdminMessages />} />
          <Route path="ai" element={<AdminAI />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="outreach" element={<AdminOutreach />} />
          <Route path="analytics" element={<AdminAnalytics />} />
        </Route>
      </Routes>
    </div>
  );
}
