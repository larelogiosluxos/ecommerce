import { useState, useEffect } from 'react';
import { db, auth } from '../../Firebase'; 
import { 
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy 
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, TextField, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Snackbar, Alert, Switch, FormControlLabel, Collapse, MenuItem, LinearProgress, Avatar
} from '@mui/material';
import Grid from '@mui/material/Grid'; 
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';

interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  description: string;
  featured: boolean;
  category: string;
}

const categories = ["Masculino", "Feminino", "Luxo", "Esportivo"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [featured, setFeatured] = useState(false);
  const [category, setCategory] = useState('Masculino');
  const [uploadProgress, setUploadProgress] = useState(0);

  const [products, setProducts] = useState<Watch[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<Watch>>({});
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // --- NOVA FUNÇÃO DE UPLOAD (CLOUDINARY) ---
  const handleUploadImage = async (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadProgress(20); 
    
    const formData = new FormData();
    formData.append('file', file);
    // CONFIGURAÇÃO IMPORTANTE:
    formData.append('upload_preset', 'ecommerce '); // <--- COLOQUE SEU PRESET AQUI
    
    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/dywsf0que/image/upload`, // <--- COLOQUE SEU CLOUD NAME AQUI
        { method: 'POST', body: formData }
      );

      const data = await response.json();

      if (data.secure_url) {
        setImageUrl(data.secure_url);
        showMsg("Imagem carregada com sucesso!");
        setUploadProgress(0);
      } else {
        throw new Error("Erro no upload");
      }
    } catch (error) {
      console.error("Erro no upload:", error);
      showMsg("Erro ao subir imagem. Verifique as chaves.", "error");
      setUploadProgress(0);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/portal-interno');
    } catch (err) {
      showMsg("Erro ao sair.", "error");
    }
  };

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
    if (!imageUrl) return alert("Por favor, faça o upload da imagem primeiro.");
    
    setLoading(true);
    try {
      await addDoc(collection(db, "products"), {
        name, brand, price: Number(price), description, imageUrl, featured, category,
        createdAt: new Date()
      });
      setName(''); setBrand(''); setPrice(''); setDescription(''); setImageUrl(''); setFeatured(false);
      setShowForm(false);
      showMsg("Relógio publicado!");
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#1976d2' }}>Gestão de Estoque</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="error" startIcon={<LogoutIcon />} onClick={handleLogout}>Sair</Button>
            <Button variant="contained" startIcon={showForm ? <CancelIcon /> : <AddIcon />} color={showForm ? "error" : "primary"} onClick={() => setShowForm(!showForm)}>
                {showForm ? "Cancelar" : "Novo Produto"}
            </Button>
        </Box>
      </Box>

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
              
              <Grid size={{ xs: 12 }}>
                <Box sx={{ border: '2px dashed #ccc', p: 3, textAlign: 'center', borderRadius: 2, bgcolor: '#fafafa' }}>
                  {imageUrl ? (
                    <Box sx={{ mb: 2 }}>
                      <img src={imageUrl} alt="Preview" style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 8 }} />
                      <Typography variant="caption" display="block" color="success.main">Imagem vinculada!</Typography>
                    </Box>
                  ) : (
                    <CloudUploadIcon sx={{ fontSize: 40, color: '#ccc', mb: 1 }} />
                  )}
                  
                  <Button variant="outlined" component="label" disabled={uploadProgress > 0}>
                    {uploadProgress > 0 ? `Processando...` : "Selecionar Foto do Relógio"}
                    <input type="file" hidden accept="image/*" onChange={handleUploadImage} />
                  </Button>
                  
                  {uploadProgress > 0 && <LinearProgress variant="indeterminate" sx={{ mt: 2 }} />}
                </Box>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField select fullWidth label="Categoria" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Preço (R$)" type="number" value={price} onChange={e => setPrice(e.target.value)} required />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField fullWidth label="Descrição" multiline rows={2} value={description} onChange={e => setDescription(e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel control={<Switch checked={featured} onChange={(e) => setFeatured(e.target.checked)} />} label="Destacar na página inicial" />
              </Grid>
            </Grid>
            <Button type="submit" variant="contained" size="large" sx={{ mt: 2 }} disabled={loading || uploadProgress > 0}>
              {loading ? 'Salvando...' : 'Confirmar Cadastro'}
            </Button>
          </Box>
        </Paper>
      </Collapse>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Destaque</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Produto</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Categoria</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Preço</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {products.map((p) => (
              <TableRow key={p.id} hover>
                <TableCell>
                  <IconButton onClick={() => toggleFeatured(p)}>{p.featured ? <StarIcon sx={{ color: '#fbc02d' }} /> : <StarBorderIcon />}</IconButton>
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField size="small" value={editFormData.name} onChange={e => setEditFormData({...editFormData, name: e.target.value})} />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar src={p.imageUrl} variant="rounded" />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{p.name}</Typography>
                        <Typography variant="caption">{p.brand}</Typography>
                      </Box>
                    </Box>
                  )}
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField select size="small" fullWidth value={editFormData.category} onChange={e => setEditFormData({...editFormData, category: e.target.value})}>
                      {categories.map((option) => (<MenuItem key={option} value={option}>{option}</MenuItem>))}
                    </TextField>
                  ) : (p.category)}
                </TableCell>
                <TableCell>
                  {editId === p.id ? (
                    <TextField size="small" type="number" value={editFormData.price} onChange={e => setEditFormData({...editFormData, price: Number(e.target.value)})} />
                  ) : (`R$ ${p.price?.toLocaleString('pt-BR')}`)}
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