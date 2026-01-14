import { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Badge, IconButton, 
  Box, Container, Drawer, List, ListItem, ListItemText, 
  Divider, ListItemAvatar, Avatar, ListItemSecondaryAction 
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../Firebase';
import { doc, getDoc } from 'firebase/firestore';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

interface NavbarProps {
  cartCount: number;
  cartItems: CartItem[];
  onRemoveItem: (id: string) => void;
  onClearCart: () => void; 
}

const Navbar = ({ cartCount, cartItems, onRemoveItem }: NavbarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  // Monitora o estado de autenticação e busca o nome do usuário no Firestore
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            // Pega apenas o primeiro nome para a saudação
            const fullName = docSnap.data().nome || "";
            setUserName(fullName.split(' ')[0]);
          }
        } catch (error) {
          console.error("Erro ao buscar nome do usuário:", error);
        }
      } else {
        setUserName(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // Cálculo do Total com segurança
  const total = (cartItems || []).reduce((acc, item) => acc + (item.price * item.quantity), 0);

  // Lógica de Checkout: Redireciona conforme o status de login
  const handleCheckout = () => {
    setIsDrawerOpen(false);
    if (auth.currentUser) {
      navigate('/checkout-pagamento');
    } else {
      navigate('/login-cliente');
    }
  };

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: '#fff', color: '#000', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 0 } }}>
            
            {/* LOGO / NOME DA LOJA */}
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1 }}>
                LA RELÓGIOS LUXO
              </Typography>
            </Box>

            {/* ÁREA DE USUÁRIO E CARRINHO */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1, sm: 2 } }}>
              
              {userName ? (
                <Typography variant="body2" sx={{ fontWeight: '600', color: '#B8860B' }}>
                  Olá, {userName}
                </Typography>
              ) : (
                <Button 
                  component={Link} 
                  to="/login-cliente" 
                  startIcon={<AccountCircleIcon />}
                  sx={{ 
                    color: '#000', 
                    textTransform: 'none', 
                    fontWeight: 'bold',
                    display: { xs: 'none', sm: 'flex' } // Esconde texto no mobile muito pequeno se necessário
                  }}
                >
                  Login
                </Button>
              )}

              {/* Botão Admin (Discreto) */}
              <Button component={Link} to="/portal-interno" size="small" sx={{ color: '#ccc', fontSize: '0.6rem', minWidth: 'auto' }}>
                Admin
              </Button>
              
              <IconButton color="inherit" onClick={() => setIsDrawerOpen(true)}>
                <Badge badgeContent={cartCount} color="primary">
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </Box>
          </Toolbar>
        </Container>
      </AppBar>

      {/* GAVETA DO CARRINHO */}
      <Drawer
        anchor="right"
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        PaperProps={{ sx: { width: { xs: '100%', sm: 400 }, p: 2, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Seu Carrinho</Typography>
          <IconButton onClick={() => setIsDrawerOpen(false)}><CloseIcon /></IconButton>
        </Box>
        
        <Divider />

        <List sx={{ flexGrow: 1, overflowY: 'auto', mt: 1 }}>
          {cartItems.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 4 }}>
               <Typography sx={{ color: 'gray' }}>Seu carrinho está vazio.</Typography>
               <Button onClick={() => setIsDrawerOpen(false)} sx={{ mt: 2 }}>Ver Relógios</Button>
            </Box>
          ) : (
            cartItems.map((item) => (
              <ListItem key={item.id} sx={{ px: 0 }}>
                <ListItemAvatar>
                  <Avatar src={item.imageUrl} variant="rounded" sx={{ width: 60, height: 60, mr: 2 }} />
                </ListItemAvatar>
                <ListItemText
                  primary={item.name}
                  secondary={`${item.quantity}x R$ ${item.price.toLocaleString('pt-BR')}`}
                  primaryTypographyProps={{ fontWeight: 'bold' }}
                />
                <ListItemSecondaryAction>
                  <IconButton edge="end" color="error" onClick={() => onRemoveItem(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
            ))
          )}
        </List>

        {cartItems.length > 0 && (
          <Box sx={{ pt: 2, pb: 2, borderTop: '2px solid #eee', bgcolor: '#fff' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6">Total:</Typography>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#B8860B' }}>
                R$ {total.toLocaleString('pt-BR')}
              </Typography>
            </Box>
            
            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              onClick={handleCheckout}
              sx={{ 
                mb: 1.5, 
                py: 1.5,    
                bgcolor: '#000', 
                '&:hover': { bgcolor: '#B8860B' }, 
                fontWeight: 'bold',
                textTransform: 'none',
                fontSize: '1rem'
              }}
            >
              Finalizar Compra
            </Button>
            
            <Button 
              variant="outlined" 
              fullWidth 
              onClick={() => setIsDrawerOpen(false)}
              sx={{ textTransform: 'none', py: 1 }}
            >
              Continuar Comprando
            </Button>
          </Box>
        )}
      </Drawer>
    </>
  );
};

export default Navbar;