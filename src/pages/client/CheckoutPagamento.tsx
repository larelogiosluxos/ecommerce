import { useState, useEffect } from 'react';
import { db, auth } from '../../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Container, Typography, Paper, Box, Divider, 
  Button, List, ListItem, ListItemText, CircularProgress, Alert 
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate } from 'react-router-dom';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; // Ícone de voltar

const CheckoutPagamento = ({ cartItems, total }: any) => {
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        try {
          const docRef = doc(db, "users", user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          }
        } catch (error) {
          console.error("Erro ao buscar dados do usuário:", error);
        }
      } else {
        // Se o usuário tentar acessar sem login, volta para o login de cliente
        navigate('/login-cliente');
      }
      setLoading(false);
    };

    fetchUserData();
  }, [navigate]);

  const handlePagar = () => {
    alert("Redirecionando para o ambiente de pagamento seguro do Mercado Pago...");
    // Aqui incluiremos a lógica de integração real posteriormente
  };

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
      <CircularProgress color="inherit" />
    </Box>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* BOTÃO VOLTAR */}
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')}
        sx={{ 
          mb: 3, 
          color: 'text.secondary', 
          textTransform: 'none',
          '&:hover': { color: '#B8860B' }
        }}
      >
        Voltar para a loja
      </Button>

      <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 4 }}>
        Finalizar Compra
      </Typography>
      
      <Grid container spacing={4}>
        {/* Coluna da Esquerda: Dados e Entrega */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={2} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <LocalShippingIcon sx={{ mr: 1, color: '#B8860B' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Dados de Entrega
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ lineHeight: 2 }}>
              <Typography variant="body1">
                <strong>Nome:</strong> {userData?.nome || 'Não informado'}
              </Typography>
              <Typography variant="body1">
                <strong>WhatsApp:</strong> {userData?.telefone || 'Não informado'}
              </Typography>
              <Typography variant="body1">
                <strong>Endereço:</strong> {userData?.endereco || 'Não informado'}
              </Typography>
            </Box>
            
            <Button 
              size="small" 
              onClick={() => navigate('/cadastro')} // O cadastro serve para atualizar dados também
              sx={{ mt: 2, color: '#B8860B', fontWeight: 'bold', textTransform: 'none' }}
            >
              Alterar dados de entrega
            </Button>
          </Paper>

          <Paper elevation={2} sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <PaymentIcon sx={{ mr: 1, color: '#B8860B' }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                Método de Pagamento
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Alert severity="info" variant="outlined">
              Finalize seu pagamento via **Pix** ou **Cartão de Crédito** através do Mercado Pago.
            </Alert>
          </Paper>
        </Grid>

        {/* Coluna da Direita: Resumo do Pedido */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={3} sx={{ p: 3, borderRadius: 2, bgcolor: '#fdfdfd', border: '1px solid #eee' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Resumo do Pedido
            </Typography>
            
            <List disablePadding>
              {cartItems.length > 0 ? (
                cartItems.map((item: any) => (
                  <ListItem key={item.id} sx={{ py: 1.5, px: 0 }}>
                    <ListItemText 
                      primary={`${item.quantity}x ${item.name}`} 
                      secondary={`${item.brand}`}
                      primaryTypographyProps={{ fontWeight: '500' }}
                    />
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      R$ {(item.price * item.quantity).toLocaleString('pt-BR')}
                    </Typography>
                  </ListItem>
                ))
              ) : (
                <Typography variant="body2" color="text.secondary">Seu carrinho está vazio.</Typography>
              )}
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Subtotal</Typography>
                <Typography>R$ {total.toLocaleString('pt-BR')}</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography color="text.secondary">Frete</Typography>
                <Typography sx={{ color: 'green', fontWeight: 'bold' }}>Grátis</Typography>
              </Box>
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Total</Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#B8860B' }}>
                  R$ {total.toLocaleString('pt-BR')}
                </Typography>
              </Box>
            </List>

            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              disabled={cartItems.length === 0}
              onClick={handlePagar}
              sx={{ 
                mt: 4, 
                py: 2, 
                bgcolor: '#000', 
                color: '#fff',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                '&:hover': { bgcolor: '#B8860B' }
              }}
            >
              PAGAR AGORA
            </Button>
            
            <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 2, color: 'text.secondary' }}>
              Pagamento processado com segurança por Mercado Pago
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default CheckoutPagamento;