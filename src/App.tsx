import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Home from './pages/Home';
import Status from './pages/Status';
import Journal from './pages/Journal';
import JournalDetail from './pages/JournalDetail';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Travel from './pages/Travel';
import Memo from './pages/Memo';
import Gallery from './pages/Gallery';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter basename="/our-space">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/" element={<Home />} />
          <Route path="/status" element={<Status />} />
          <Route path="/journal" element={<Journal />} />
          <Route path="/journal/:id" element={<JournalDetail />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/memo" element={<Memo />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
