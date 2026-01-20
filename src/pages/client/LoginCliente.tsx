import { useState } from 'react';
import { auth, db } from '../../Firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Container, TextField, Button, Typography, Box, Paper, 
  Divider, InputAdornment, IconButton, Alert 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const LoginCliente = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // Verifica se o usuário é admin (não pode fazer login como cliente)
      const adminDocRef = doc(db, 'admins', user.uid);
      const adminDoc = await getDoc(adminDocRef);
      
      if (adminDoc.exists() && adminDoc.data()?.isAdmin === true) {
        // Se for admin, faz logout e mostra erro
        await auth.signOut();
        setError("Esta é uma conta de administrador. Use o portal administrativo para acessar.");
        setLoading(false);
        return;
      }
      
      // Se não for admin, permite o login e redireciona
      navigate('/'); 
    } catch (err: any) {
      setError("E-mail ou senha incorretos. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10, mb: 10, display: 'flex', alignItems: 'center' }}>
      <Paper elevation={4} sx={{ p: 4, width: '100%', borderRadius: 3, border: '1px solid #eee' }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#000', mb: 1 }}>
            Acesse sua Conta
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Bem-vindo à La Relógios Luxo
          </Typography>
        </Box>
        
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="E-mail"
            variant="outlined"
            margin="normal"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          
          <TextField
            fullWidth
            label="Senha"
            variant="outlined"
            margin="normal"
            required
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            disabled={loading}
            sx={{ 
              mt: 3, 
              py: 1.5, 
              fontWeight: 'bold', 
              bgcolor: '#000',
              '&:hover': { bgcolor: '#B8860B' } 
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </Button>
        </form>

        <Divider sx={{ my: 3 }}>OU</Divider>

        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="body2">
            Ainda não tem conta? <br />
            <Link to="/cadastro" style={{ color: '#B8860B', fontWeight: 'bold', textDecoration: 'none' }}>
              Cadastre-se agora
            </Link>
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginCliente;