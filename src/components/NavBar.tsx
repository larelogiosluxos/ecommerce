import { useState, useEffect } from 'react';
import { 
  AppBar, Toolbar, Typography, Button, Badge, IconButton, 
  Box, Container, Drawer, List, ListItem, ListItemText, 
  Divider, ListItemAvatar, Avatar, ListItemSecondaryAction, ListItemButton, ListItemIcon,
  BottomNavigation, BottomNavigationAction, Paper, TextField, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import SearchIcon from '@mui/icons-material/Search';
import ChatIcon from '@mui/icons-material/Chat';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import HomeIcon from '@mui/icons-material/Home';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../Firebase';
import { signOut } from 'firebase/auth';
import { doc, getDoc, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, getDocs } from 'firebase/firestore';

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

interface Chat {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  createdAt: any;
  lastMessage: string;
  unreadByAdmin: boolean;
}

interface ChatMessage {
  id?: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp?: any;
  userId?: string;
}

const Navbar = ({ cartCount, cartItems, onRemoveItem }: NavbarProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userName, setUserName] = useState<string | null>(null);
  const [bottomNavValue, setBottomNavValue] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [trackingOpen, setTrackingOpen] = useState(false);
  const [trackingCode, setTrackingCode] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Verifica se está na página do admin
  const isAdminPage = location.pathname.startsWith('/portal-interno') || location.pathname.startsWith('/admin-dashboard');
  
  // Verifica se deve mostrar o campo de busca (apenas na home)
  const showSearchField = location.pathname === '/';

  // Função de logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUserName(null);
      navigate('/');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

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

  // Carrega ou cria chat quando o diálogo abre
  useEffect(() => {
    if (contactOpen) {
      // Verifica se o usuário está logado
      if (!auth.currentUser) {
        alert('Para usar o chat, você precisa fazer login ou se cadastrar primeiro.');
        setContactOpen(false);
        navigate('/login-cliente');
        return;
      }
      
      const loadChat = async () => {
        try {
          const chatsRef = collection(db, 'chats');
          const q = query(chatsRef, orderBy('createdAt', 'desc'));
          
          const chatSnapshot = await getDocs(q);
          let existingChat: Chat | null = null;
          
          chatSnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            if (data.userId === auth.currentUser?.uid) {
              existingChat = { id: docSnap.id, ...data } as Chat;
            }
          });

          if (existingChat) {
            const currentChatId = (existingChat as Chat).id;
            setChatId(currentChatId);

            // Escuta mensagens em tempo real
            const messagesRef = collection(db, 'chats', currentChatId, 'messages');
            const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
            
            const unsubscribeMessages = onSnapshot(messagesQuery, (snapshot) => {
              // CORREÇÃO AQUI: Definindo explicitamente o tipo ChatMessage no map
              const messages = snapshot.docs.map((docSnap) : ChatMessage => ({
                id: docSnap.id,
                ...(docSnap.data() as Omit<ChatMessage, 'id'>)
              }));
              setChatMessages(messages);
            });
            
            return () => unsubscribeMessages();
          } else {
            // Cria novo chat se não existir
            if (!auth.currentUser) return;
            
            const newChatRef = await addDoc(collection(db, 'chats'), {
              userId: auth.currentUser.uid,
              userName: userName || 'Cliente',
              userEmail: auth.currentUser.email,
              createdAt: serverTimestamp(),
              lastMessage: '',
              unreadByAdmin: false
            });
            
            setChatId(newChatRef.id);
            
            await addDoc(collection(db, 'chats', newChatRef.id, 'messages'), {
              text: 'Olá! Bem-vindo à LA Relógios. Como posso ajudá-lo?',
              sender: 'admin',
              timestamp: serverTimestamp()
            });
          }
        } catch (error) {
          console.error('Erro ao carregar chat:', error);
        }
      };
      
      loadChat();
    }
  }, [contactOpen, navigate, userName]);

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
          <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', px: { xs: 0 }, minHeight: { xs: '56px', sm: '64px' } }}>
            
            {/* Menu Hamburger (Mobile) */}
            {!isAdminPage && (
              <IconButton 
                color="inherit" 
                onClick={() => setIsMenuOpen(true)}
                sx={{ display: { xs: 'flex', md: 'none' }, mr: 1 }}
              >
                <MenuIcon />
              </IconButton>
            )}

            {/* LOGO / NOME DA LOJA */}
            <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flexGrow: { xs: 1, md: 0 } }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  letterSpacing: { xs: 0.5, md: 1 },
                  fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' }
                }}
              >
                LA RELÓGIOS
              </Typography>
            </Box>

            {/* ÁREA DE NAVEGAÇÃO DESKTOP */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 2, flexGrow: 1, ml: 4 }}>
              <Button component={Link} to="/" sx={{ color: '#000', textTransform: 'none', fontWeight: 'bold' }}>
                Início
              </Button>
            </Box>

            {/* CAMPO DE BUSCA */}
            {showSearchField && (
              <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', flexGrow: 1, maxWidth: 400, mx: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Buscar relógios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && searchTerm.trim()) {
                      navigate(`/?busca=${searchTerm}`);
                      setSearchTerm('');
                    }
                  }}
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: '#888' }} />,
                    sx: { borderRadius: 3, bgcolor: '#f5f5f5' }
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: '#B8860B' },
                      '&.Mui-focused fieldset': { borderColor: '#B8860B' }
                    }
                  }}
                />
              </Box>
            )}

            {/* ÁREA DE USUÁRIO E CARRINHO */}
            {!isAdminPage && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 2 } }}>
              
              {userName ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      fontWeight: '600', 
                      color: '#B8860B',
                      fontSize: { xs: '0.75rem', sm: '0.875rem' },
                      display: { xs: 'none', sm: 'block' }
                    }}
                  >
                    Olá, {userName}
                  </Typography>
                  <IconButton 
                    onClick={handleLogout}
                    size="small"
                    sx={{ 
                      display: { xs: 'none', sm: 'flex' },
                      color: '#B8860B',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                    title="Sair"
                  >
                    <LogoutIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <Button 
                  component={Link} 
                  to="/login-cliente" 
                  startIcon={<AccountCircleIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />}
                  sx={{ 
                    color: '#000', 
                    textTransform: 'none', 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    display: { xs: 'none', sm: 'flex' },
                    minWidth: 'auto',
                    px: { xs: 1, sm: 2 }
                  }}
                >
                  Login
                </Button>
              )}

              {/* Ícone de Login apenas no Mobile */}
              {!userName && (
                <IconButton 
                  component={Link} 
                  to="/login-cliente"
                  sx={{ display: { xs: 'flex', sm: 'none' }, color: '#000', p: 0.5 }}
                >
                  <AccountCircleIcon />
                </IconButton>
              )}
              
              <IconButton color="inherit" onClick={() => setIsDrawerOpen(true)} sx={{ p: { xs: 0.5, sm: 1 } }}>
                <Badge badgeContent={cartCount} color="primary">
                  <ShoppingCartIcon sx={{ fontSize: { xs: '1.3rem', sm: '1.5rem' } }} />
                </Badge>
              </IconButton>
            </Box>
            )}
          </Toolbar>
        </Container>
        
        {/* CAMPO DE BUSCA MOBILE */}
        {showSearchField && (
          <Box sx={{ display: { xs: 'block', md: 'none' }, bgcolor: '#fff', px: 2, py: 1.5, borderTop: '1px solid #f0f0f0' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Buscar relógios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && searchTerm.trim()) {
                  navigate(`/?busca=${searchTerm}`);
                  setSearchTerm('');
                }
              }}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: '#888' }} />,
                sx: { borderRadius: 3, bgcolor: '#f5f5f5' }
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': { borderColor: 'transparent' },
                  '&:hover fieldset': { borderColor: '#B8860B' },
                  '&.Mui-focused fieldset': { borderColor: '#B8860B' }
                }
              }}
            />
          </Box>
        )}
      </AppBar>

      {/* MENU LATERAL - Categorias */}
      <Drawer
        anchor="left"
        open={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        PaperProps={{ sx: { width: { xs: 260, sm: 300 } } }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Categorias</Typography>
            <IconButton onClick={() => setIsMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <Divider sx={{ mb: 2 }} />
          
          <List>
            <ListItemButton component={Link} to="/" onClick={() => setIsMenuOpen(false)}>
              <ListItemText primary="Todos" />
            </ListItemButton>
            
            <ListItemButton component={Link} to="/?categoria=Masculino" onClick={() => setIsMenuOpen(false)}>
              <ListItemText primary="Masculino" />
            </ListItemButton>
            
            <ListItemButton component={Link} to="/?categoria=Feminino" onClick={() => setIsMenuOpen(false)}>
              <ListItemText primary="Feminino" />
            </ListItemButton>
            
            <ListItemButton component={Link} to="/?categoria=Luxo" onClick={() => setIsMenuOpen(false)}>
              <ListItemText primary="Luxo" />
            </ListItemButton>
            
            <ListItemButton component={Link} to="/?categoria=Esportivo" onClick={() => setIsMenuOpen(false)}>
              <ListItemText primary="Esportivo" />
            </ListItemButton>
            
            <Divider sx={{ my: 2 }} />
            
            {!userName && (
              <ListItemButton component={Link} to="/login-cliente" onClick={() => setIsMenuOpen(false)}>
                <ListItemIcon><LoginIcon /></ListItemIcon>
                <ListItemText primary="Entrar" />
              </ListItemButton>
            )}
            
            {userName && (
              <>
                <ListItem>
                  <ListItemText 
                    primary={`Olá, ${userName}`} 
                    primaryTypographyProps={{ fontWeight: 'bold', color: '#B8860B' }}
                  />
                </ListItem>
                <ListItemButton onClick={() => {
                  handleLogout();
                  setIsMenuOpen(false);
                }}>
                  <ListItemIcon><LogoutIcon /></ListItemIcon>
                  <ListItemText primary="Sair" />
                </ListItemButton>
              </>
            )}
          </List>
        </Box>
      </Drawer>

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

      {/* DIÁLOGO DE FALE CONOSCO - CHAT */}
      <Dialog 
        open={contactOpen} 
        onClose={() => setContactOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          sx: { height: { xs: '80vh', sm: '600px' }, maxHeight: { xs: '80vh', sm: '600px' } }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Chat com a Loja
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Online • Resposta rápida
              </Typography>
            </Box>
            <IconButton onClick={() => setContactOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* Área de mensagens */}
          <Box 
            sx={{ 
              flexGrow: 1, 
              overflowY: 'auto', 
              p: 2, 
              bgcolor: '#f5f5f5',
              display: 'flex',
              flexDirection: 'column',
              gap: 1.5
            }}
          >
            {chatMessages.map((msg, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  mb: 1
                }}
              >
                <Box
                  sx={{
                    maxWidth: '75%',
                    bgcolor: msg.sender === 'user' ? '#B8860B' : '#fff',
                    color: msg.sender === 'user' ? '#fff' : '#000',
                    p: 1.5,
                    borderRadius: 2,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {msg.text}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block', 
                      mt: 0.5, 
                      opacity: 0.7,
                      fontSize: '0.7rem'
                    }}
                  >
                    {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : ''}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* Campo de input */}
          <Box sx={{ p: 2, bgcolor: '#fff', borderTop: '1px solid #eee' }}>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                placeholder="Digite sua mensagem..."
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                onKeyPress={async (e) => {
                  if (e.key === 'Enter' && chatMessage.trim() && chatId) {
                    try {
                      await addDoc(collection(db, 'chats', chatId, 'messages'), {
                        text: chatMessage,
                        sender: 'user',
                        timestamp: serverTimestamp()
                      });
                      setChatMessage('');
                    } catch (error) {
                      console.error('Erro ao enviar mensagem:', error);
                    }
                  }
                }}
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 3
                  }
                }}
              />
              <Button 
                variant="contained"
                onClick={async () => {
                  if (chatMessage.trim() && chatId) {
                    try {
                      await addDoc(collection(db, 'chats', chatId, 'messages'), {
                        text: chatMessage,
                        sender: 'user',
                        timestamp: serverTimestamp()
                      });
                      setChatMessage('');
                    } catch (error) {
                      console.error('Erro ao enviar mensagem:', error);
                    }
                  }
                }}
                sx={{ 
                  bgcolor: '#B8860B', 
                  '&:hover': { bgcolor: '#000' },
                  minWidth: 'auto',
                  px: 3,
                  borderRadius: 3
                }}
              >
                Enviar
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      {/* DIÁLOGO DE RASTREIO */}
      <Dialog 
        open={trackingOpen} 
        onClose={() => setTrackingOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Rastrear Pedido
            <IconButton onClick={() => setTrackingOpen(false)}><CloseIcon /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Digite o código de rastreamento do seu pedido:
          </Typography>
          <TextField
            autoFocus
            fullWidth
            placeholder="Ex: BR123456789"
            value={trackingCode}
            onChange={(e) => setTrackingCode(e.target.value)}
            InputProps={{
              startAdornment: <LocalShippingIcon sx={{ mr: 1, color: 'gray' }} />
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setTrackingOpen(false)}>Cancelar</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (trackingCode.trim()) {
                alert(`Rastreando pedido: ${trackingCode}`);
                setTrackingOpen(false);
                setTrackingCode('');
              }
            }}
            sx={{ bgcolor: '#000', '&:hover': { bgcolor: '#B8860B' } }}
          >
            Rastrear
          </Button>
        </DialogActions>
      </Dialog>

      {/* BOTTOM NAVIGATION (Mobile) */}
      {!isAdminPage && (
        <Paper 
          sx={{ 
            position: 'fixed', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            display: { xs: 'block', md: 'none' },
            zIndex: 1100,
            boxShadow: '0 -2px 10px rgba(0,0,0,0.1)'
          }} 
          elevation={3}
        >
        <BottomNavigation
          value={bottomNavValue}
          onChange={(_event, newValue) => {
            setBottomNavValue(newValue);
            if (newValue === 0) navigate('/');
            if (newValue === 1) {
              // Verifica se o usuário está logado antes de abrir o chat
              if (!auth.currentUser) {
                alert('Para usar o chat, você precisa fazer login ou se cadastrar primeiro.');
                navigate('/login-cliente');
                return;
              }
              setContactOpen(true);
            }
            if (newValue === 2) setTrackingOpen(true);
          }}
          showLabels
          sx={{ height: 60 }}
        >
          <BottomNavigationAction 
            label="Início" 
            icon={<HomeIcon />} 
            sx={{ minWidth: 0, fontSize: '0.7rem' }}
          />
          <BottomNavigationAction 
            label="Contato" 
            icon={<ChatIcon />} 
            sx={{ minWidth: 0, fontSize: '0.7rem' }}
          />
          <BottomNavigationAction 
            label="Rastreio" 
            icon={<LocalShippingIcon />} 
            sx={{ minWidth: 0, fontSize: '0.7rem' }}
          />
        </BottomNavigation>
      </Paper>
      )}
    </>
  );
};

export default Navbar;