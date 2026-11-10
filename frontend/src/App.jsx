import React, { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import MenuList from './components/MenuList';
import OrderStatusTracker from './components/OrderStatusTracker';
import StaffDashboard from './components/StaffDashboard/StaffDashboard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';

export default function App() {
  const [currentView, setCurrentView] = useState('menu'); // 'menu' | 'track' | 'staff'
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [trackedOrderId, setTrackedOrderId] = useState('');

  // Handle navigating directly from order confirmation to tracker
  const handleTrackOrder = (orderId) => {
    setTrackedOrderId(orderId);
    setCurrentView('track');
  };

  return (
    <AuthProvider>
      <CartProvider>
        <div className="app-layout">
          {/* Top Navigation */}
          <Navbar
            currentView={currentView}
            setCurrentView={setCurrentView}
            openCart={() => setIsCartOpen(true)}
          />

          {/* Main Content Area */}
          <main className="main-content">
            {currentView === 'menu' && <MenuList />}
            {currentView === 'track' && (
              <OrderStatusTracker initialOrderId={trackedOrderId} />
            )}
            {currentView === 'staff' && <StaffDashboard />}
          </main>

          {/* Sliding Cart Drawer */}
          <CartDrawer
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onOpenCheckout={() => setIsCheckoutOpen(true)}
          />

          {/* Checkout & Confirmation Modal */}
          <CheckoutModal
            isOpen={isCheckoutOpen}
            onClose={() => setIsCheckoutOpen(false)}
            onTrackOrder={handleTrackOrder}
          />

          {/* Application Footer */}
          <footer className="app-footer">
            <div className="footer-content">
              <h3 className="footer-brand">AromaCraft Coffee & Roastery</h3>
              <p className="footer-location">Kingsway Road, Maseru, Lesotho | Open Daily 07:00 - 18:00</p>
              <p className="footer-copyright">&copy; {new Date().getFullYear()} AromaCraft Coffee & Roastery. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

