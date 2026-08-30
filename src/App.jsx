import Home from "./pages/Home";
import RegisterForm from "./components/RegisterForm"
import AdminPage from "./pages/AdminPage";
import ViewRegistrations from "./pages/ViewRegistrations";
import "./index.css";
import "./responsiveness.css";
import "./components/RegisterForm.css"
import { Route, Routes, BrowserRouter } from 'react-router-dom'

export default function App() {
  return (
  <BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />}/>
    <Route path="/form" element={<RegisterForm />}/>
    <Route path="/admin" element={<AdminPage />}/>
    <Route path="/registered" element={<ViewRegistrations />}/>
  </Routes>
  </BrowserRouter>
  );
}