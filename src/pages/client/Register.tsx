import { useState } from 'react';
import { auth, db } from '../../Firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { Container, TextField, Button, Typography, Box, Paper, Grid, Alert } from '@mui/material';

const Register = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    endereco: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 1. Cria o usuário no Firebase Authentication
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        formData.email, 
        formData.senha
      );
      const user = userCredential.user;

      // 2. Salva os dados adicionais no Firestore na coleção "users"
      await setDoc(doc(db, "users", user.uid), {
        nome: formData.nome,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        role: 'client', // Diferencia de 'admin'
        createdAt: new Date()
      });

      navigate('/'); // Redireciona para a loja após sucesso
    } catch (err: any) {
      setError("Erro ao criar conta. Verifique se o e-mail já existe.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1, textAlign: 'center' }}>
          Criar Conta
        </Typography>
        <Typography variant="body2" sx={{ mb: 3, textAlign: 'center', color: 'gray' }}>
          Cadastre-se para realizar suas compras com segurança.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <form onSubmit={handleRegister}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Nome Completo" required 
                onChange={e => setFormData({...formData, nome: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="E-mail" type="email" required 
                onChange={e => setFormData({...formData, email: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField fullWidth label="Senha (mínimo 6 caracteres)" type="password" required 
                onChange={e => setFormData({...formData, senha: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="WhatsApp" required 
                onChange={e => setFormData({...formData, telefone: e.target.value})} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField fullWidth label="Endereço de Entrega" required 
                onChange={e => setFormData({...formData, endereco: e.target.value})} />
            </Grid>
          </Grid>
          
          <Button type="submit" variant="contained" fullWidth size="large" disabled={loading}
            sx={{ mt: 4, bgcolor: '#000', py: 1.5, fontWeight: 'bold', '&:hover': { bgcolor: '#B8860B' } }}>
            {loading ? "Processando..." : "Finalizar Cadastro"}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Já tem uma conta? <Link to="/login-cliente" style={{ color: '#B8860B', fontWeight: 'bold' }}>Faça login</Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Container>
  );
};

export default Register;