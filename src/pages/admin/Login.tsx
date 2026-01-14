import React, { useState } from 'react';
import { auth } from '../../Firebase'; 
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Container, TextField, Button, Typography, Box, Paper, 
  Divider, InputAdornment, IconButton 
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // Estado para o olhinho
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // O .trim() remove espaços acidentais no início ou fim do e-mail
      await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate('/admin-dashboard');
    } catch (error) {
      alert("Credenciais de administrador incorretas.");
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Container maxWidth="xs" sx={{ height: '100vh', display: 'flex', alignItems: 'center' }}>
      <Paper elevation={3} sx={{ p: 4, width: '100%', borderRadius: 2 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom color="primary" sx={{ fontWeight: 'bold' }}>
            Portal Interno
          </Typography>
          <Typography variant="body2" color="textSecondary">
            La Relógios Luxo - Gestão
          </Typography>
        </Box>
        
        <Divider sx={{ mb: 3 }} />

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
            type={showPassword ? 'text' : 'password'} // Alterna entre texto e senha
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            InputProps={{ // Adiciona o ícone no final do input
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    aria-label="toggle password visibility"
                    onClick={handleClickShowPassword}
                    edge="end"
                  >
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
            color="primary"
            sx={{ mt: 3, py: 1.5, fontWeight: 'bold' }}
          >
            Acessar Painel
          </Button>
        </form>
      </Paper>
    </Container>
  );
};

export default Login;