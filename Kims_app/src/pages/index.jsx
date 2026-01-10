import Layout from "./Layout.jsx";

import Checklists from "./Checklists";

import MessageBoard from "./MessageBoard";

import Take5 from "./Take5";

import History from "./History";

import Employees from "./Employees";

import Services from "./Services";

import WorkshopJobCard from "./WorkshopJobCard";

import MaintenanceHub from "./MaintenanceHub";

import WorkshopInventory from "./WorkshopInventory";

import MachineCosts from "./MachineCosts";

import Plant from "./Plant";

import Login from "./Login";

import Signup from "./Signup";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const PAGES = {
    
    Checklists: Checklists,
    
    MessageBoard: MessageBoard,
    
    Take5: Take5,
    
    History: History,
    
    Employees: Employees,
    
    Services: Services,
    
    WorkshopJobCard: WorkshopJobCard,
    
    MaintenanceHub: MaintenanceHub,
    
    WorkshopInventory: WorkshopInventory,
    
    MachineCosts: MachineCosts,
    
    Plant: Plant,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const isAuthPage = location.pathname === '/login' || location.pathname === '/signup';
    const currentPage = _getCurrentPage(location.pathname);
    
    // Don't show Layout for auth pages
    if (isAuthPage) {
        return (
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
            </Routes>
        );
    }
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
                
                
                <Route path="/Checklists" element={<ProtectedRoute><Checklists /></ProtectedRoute>} />
                
                <Route path="/MessageBoard" element={<ProtectedRoute><MessageBoard /></ProtectedRoute>} />
                
                <Route path="/Take5" element={<ProtectedRoute><Take5 /></ProtectedRoute>} />
                
                <Route path="/History" element={<ProtectedRoute><History /></ProtectedRoute>} />
                
                <Route path="/Employees" element={<ProtectedRoute><Employees /></ProtectedRoute>} />
                
                <Route path="/Services" element={<ProtectedRoute><Services /></ProtectedRoute>} />
                
                <Route path="/WorkshopJobCard" element={<ProtectedRoute><WorkshopJobCard /></ProtectedRoute>} />
                
                <Route path="/MaintenanceHub" element={<ProtectedRoute><MaintenanceHub /></ProtectedRoute>} />
                
                <Route path="/WorkshopInventory" element={<ProtectedRoute><WorkshopInventory /></ProtectedRoute>} />
                
                <Route path="/MachineCosts" element={<ProtectedRoute><MachineCosts /></ProtectedRoute>} />
                
                <Route path="/Plant" element={<ProtectedRoute><Plant /></ProtectedRoute>} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}