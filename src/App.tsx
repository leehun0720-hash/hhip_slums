/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import ProductManager from './pages/ProductManager';
import ProcessManager from './pages/ProcessManager';
import Scanner from './pages/Scanner';
import Reports from './pages/Reports';
import BuyerInventory from './pages/BuyerInventory';
import AuthProvider from './components/AuthProvider';
import AdminSettings from './pages/AdminSettings';
import ContractManager from './pages/ContractManager';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="product" element={<ProductManager />} />
            <Route path="buyer-order" element={<ProductManager />} />
            <Route path="process" element={<ProcessManager />} />
            <Route path="buyer-inventory" element={<BuyerInventory />} />
            <Route path="scanner" element={<Scanner />} />
            <Route path="reports" element={<Reports />} />
            <Route path="contract" element={<ContractManager />} />
            <Route path="admin" element={<AdminSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
