import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

// Importação de Componentes
import Navbar from './components/NavBar';

// Importação de Páginas (Cliente)
import ProductList from './pages/client/ProductList';
import LoginCliente from './pages/client/LoginCliente';
import Register from './pages/client/Register';
import CheckoutPagamento from './pages/client/CheckoutPagamento';

// Importação de Páginas (Admin)
import Login from './pages/admin/Login';
import AdminDashboard from './pages/admin/AdminDashboard';

// Interface para o item do carrinho
interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

// Configuração do Tema de Luxo (Dourado e Preto)
const theme = createTheme({
  palette: {
    primary: {
      main: '#B8860B', // DarkGoldenrod (Dourado Luxo)
    },
    secondary: {
      main: '#000000', // Preto
    },
    background: {
      default: '#fafafa',
    },
  },
  typography: {
    fontFamily: '"Montserrat", "Roboto", "Arial", sans-serif',
  },
});

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);

  // 1. Função para adicionar ao carrinho
  const addToCart = (product: any) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  // 2. Função para remover item específico do carrinho
  const removeItem = (id: string) => {
    setCart((prevCart) => prevCart.filter(item => item.id !== id));
  };

  // 3. Função para limpar todo o carrinho (pós-pagamento)
  const clearCart = () => setCart([]);

  // 4. Cálculos para a Navbar e Checkout
  // Quantidade total de itens (Badge)
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  
  // Valor total em Reais (Resolve o erro 'cartTotal')
  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <ThemeProvider theme={theme}>
      {/* CssBaseline ajuda a normalizar os estilos entre navegadores */}
      <CssBaseline /> 
      <Router>
        {/* Navbar visível em todas as rotas */}
        <Navbar 
          cartCount={cartCount} 
          cartItems={cart} 
          onRemoveItem={removeItem}
          onClearCart={clearCart} 
        />
        
        <Routes>
          {/* Rotas Públicas / Cliente */}
          <Route path="/" element={<ProductList onAddToCart={addToCart} />} />
          <Route path="/login-cliente" element={<LoginCliente />} />
          <Route path="/cadastro" element={<Register />} />
          <Route 
            path="/checkout-pagamento" 
            element={<CheckoutPagamento cartItems={cart} total={cartTotal} />} 
          />

          {/* Rotas Administrativas */}
          <Route path="/portal-interno" element={<Login />} />
          <Route path="/admin-dashboard" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;