import Home from "./pages/Home";
import RegisterForm from "./components/RegisterForm"
import "./index.css";
import { Route, Routes, BrowserRouter } from 'react-router-dom'

export default function App() {
  return (
  <BrowserRouter>
  <Routes>
    <Route path="/" element={<Home />}/>
    <Route path="/form" element={<RegisterForm />}/>
  </Routes>
  </BrowserRouter>
  );
}
