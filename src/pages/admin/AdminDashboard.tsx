import { useState, useEffect } from 'react';
import { db } from '../../Firebase'; //
import { 
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy 
} from 'firebase/firestore';
import { 
  Container, Typography, TextField, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Snackbar, Alert, Switch, FormControlLabel, Collapse
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Usando Grid2 para evitar erros de tipagem
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';

interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  description: string;
  featured: boolean;
}

const AdminDashboard = () => {
  // Controle de visibilidade do formulário
  const [showForm, setShowForm] = useState(false);

  // Estados para Cadastro
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);

  // Estados para Gestão
  const [products, setProducts] = useState<Watch[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Watch>>({});
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const fetchProducts = async () => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const querySnapshot = await getDocs(q);
    const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Watch[];
    setProducts(docs);
  };

  useEffect(() => { fetchProducts(); }, []);

  const showMsg = (msg: string, sev: 'success' | 'error' = 'success') => {
    setNotification({ open: true, message: msg, severity: sev });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name, brand, price: Number(price), description, imageUrl, featured, createdAt: new Date()
      });
      setName(''); setBrand(''); setPrice(''); setDescription(''); setImageUrl(''); setFeatured(false);
      setShowForm(false);
      showMsg("Relógio publicado com sucesso!");
      fetchProducts();
    } catch (err) { showMsg("Erro ao publicar.", "error"); }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Deseja excluir este relógio?")) {
      await deleteDoc(doc(db, "products", id));
      showMsg("Produto removido.");
      fetchProducts();
    }
  };

  const toggleFeatured = async (product: Watch) => {
    try {
      const productRef = doc(db, "products", product.id);
      await updateDoc(productRef, { featured: !product.featured });
      fetchProducts();
      showMsg(product.featured ? "Removido dos destaques" : "Adicionado aos destaques");
    } catch (err) { showMsg("Erro ao atualizar destaque", "error"); }
  };

  const handleUpdate = async () => {
    if (!editId) return;
    try {
      const productRef = doc(db, "products", editId);
      await updateDoc(productRef, { ...editFormData, price: Number(editFormData.price) });
      setEditId(null);
      showMsg("Atualizado!");
      fetchProducts();
    } catch (err) { showMsg("Erro na atualização.", "error"); }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Gestão de Estoque
        </Typography>
        <Button 
          variant="contained" 
          startIcon={showForm ? <CancelIcon /> : <AddIcon />} 
          color={showForm ? "error" : "primary"}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "Cancelar" : "Cadastrar novo produto"}
        </Button>
      </Box>

      {/* Formulário Retrátil */}
      <Collapse in={showForm}>
        <Paper sx={{ p: 3, mb: 4, borderRadius: 2, border: '1px solid #e0e0e0' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Informações do Produto</Typography>
          <Box component="form" onSubmit={handleCreate}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Modelo" variant="outlined" value={name} onChange={e => setName(e.target.value)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Marca" variant="outlined" value={brand} onChange={e => setBrand(e.target.value)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField fullWidth label="Preço (R$)" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              </Grid>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField fullWidth label="URL da Imagem" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Descrição" multiline rows={2} value={description} onChange={e => setDescription(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={featured} onChange={(e) => setFeatured(e.target.checked)} />}
                  label="Destacar este produto na página inicial"
                />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" size="large" sx={{ mt: 2 }} disabled={loading}>
              {loading ? 'Salvando...' : 'Confirmar Cadastro'}
            </Button>
          </Box>
        </Paper>
      </Collapse>

      {/* Tabela de Produtos */}
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Destaque</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Preço</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <IconButton onClick={() => toggleFeatured(p)}>
                    {p.featured ? <StarIcon sx={{ color: '#fbc02d' }} /> : <StarBorderIcon />}
                  </IconButton>
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField size="small" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                  ) : (
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: '500' }}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.brand}</Typography>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField size="small" type="number" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} />
                  ) : (
                    `R$ ${p.price.toLocaleString('pt-BR')}`
                  )}
                </TableCell>
                <TableCell align="right">
                  {editId === p.id ? (
                    <>
                      <IconButton onClick={handleUpdate} color="success"><SaveIcon /></IconButton>
                      <IconButton onClick={() => setEditId(null)} color="error"><CancelIcon /></IconButton>
                    </>
                  ) : (
                    <>
                      <IconButton onClick={() => {setEditId(p.id); setEditFormData(p)}} color="primary"><EditIcon /></IconButton>
                      <IconButton onClick={() => handleDelete(p.id)} color="error"><DeleteIcon /></IconButton>
                    </>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({...notification, open: false})}>
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;