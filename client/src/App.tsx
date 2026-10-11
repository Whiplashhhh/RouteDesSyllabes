import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { Demo } from './pages/Demo';
import { Vitrine } from './pages/Vitrine';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/demo" element={<Demo />} />
        <Route path="/vitrine" element={<Vitrine />} />
        <Route path="*" element={<Navigate to="/demo" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
