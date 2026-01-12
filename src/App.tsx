import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import ProductList from './pages/client/ProductList';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';

// Tema padrão do Material UI
const defaultTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

function App() {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      <Router>
        <Routes>
          {/* Rota do Cliente (Padrão) */}
          <Route path="/" element={<ProductList />} />
          
          {/* Rota de Login Secreta */}
          <Route path="/portal-interno" element={<Login />} />
          
          {/* Rota do Admin */}
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;