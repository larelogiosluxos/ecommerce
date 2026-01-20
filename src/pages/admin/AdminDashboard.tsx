import { useState, useEffect } from 'react';
import { db, auth } from '../../Firebase'; 
import { 
  collection, addDoc, getDocs, doc, deleteDoc, updateDoc, query, orderBy, onSnapshot, serverTimestamp, getDoc
} from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { 
  Container, Typography, TextField, Button, Box, Paper, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Snackbar, Alert, Switch, FormControlLabel, Collapse, MenuItem, LinearProgress, Avatar,
  Tabs, Tab, List, ListItem, ListItemText, Badge, ListItemButton
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
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';

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
  const [activeTab, setActiveTab] = useState(0);
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
  
  // Estados do Chat
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [adminMessage, setAdminMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Verifica se o usuário é admin ao carregar a página
  useEffect(() => {
    const checkAdminAccess = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/portal-interno');
        return;
      }

      try {
        const adminDocRef = doc(db, 'admins', user.uid);
        const adminDoc = await getDoc(adminDocRef);
        
        if (!adminDoc.exists() || adminDoc.data()?.isAdmin !== true) {
          await signOut(auth);
          alert('Acesso negado. Você não tem permissões de administrador.');
          navigate('/portal-interno');
        }
      } catch (error) {
        console.error('Erro ao verificar permissões:', error);
        navigate('/portal-interno');
      }
    };

    checkAdminAccess();
  }, [navigate]);

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

  // Carrega chats em tempo real
  useEffect(() => {
    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chatsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setChats(chatsData);
    });

    return () => unsubscribe();
  }, []);

  // Carrega mensagens do chat selecionado
  useEffect(() => {
    if (selectedChat) {
      const messagesRef = collection(db, 'chats', selectedChat.id, 'messages');
      const q = query(messagesRef, orderBy('timestamp', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const messages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setChatMessages(messages);
      });

      return () => unsubscribe();
    }
  }, [selectedChat]);

  const sendAdminMessage = async () => {
    if (adminMessage.trim() && selectedChat) {
      try {
        await addDoc(collection(db, 'chats', selectedChat.id, 'messages'), {
          text: adminMessage,
          sender: 'admin',
          timestamp: serverTimestamp()
        });
        setAdminMessage('');
      } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
      }
    }
  };

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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, md: 4 }, mb: 4 }}>
      
      {/* Tabs de navegação com botão de logout */}
      <Box sx={{ 
        borderBottom: 1, 
        borderColor: 'divider', 
        mb: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1
      }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab label="Produtos" />
          <Tab 
            label={
              <Badge badgeContent={chats.length} color="error">
                Chat
              </Badge>
            } 
            icon={<ChatIcon />} 
            iconPosition="start"
          />
        </Tabs>
        
        <IconButton 
          color="error" 
          onClick={handleLogout}
          sx={{ 
            border: '1px solid',
            borderColor: 'error.main',
            '&:hover': { bgcolor: 'error.main', color: 'white' }
          }}
          title="Sair"
        >
          <LogoutIcon />
        </IconButton>
      </Box>

      {/* Painel de Produtos */}
      {activeTab === 0 && (
        <>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button variant="contained" startIcon={showForm ? <CancelIcon /> : <AddIcon />} color={showForm ? "error" : "primary"} onClick={() => setShowForm(!showForm)}>
              {showForm ? "Cancelar" : "Novo Produto"}
            </Button>
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
      </>
      )}

      {/* Painel de Chat */}
      {activeTab === 1 && (
        <Grid container spacing={2} sx={{ 
          height: { xs: 'auto', md: '70vh' },
          mb: { xs: 2, md: 0 }
        }}>
          {/* Lista de conversas */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ height: { xs: '180px', md: '100%' }, overflow: 'auto' }}>
              <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Conversas</Typography>
              </Box>
              <List>
                {chats.length === 0 && (
                  <ListItem>
                    <ListItemText 
                      primary="Nenhuma conversa" 
                      secondary="Aguardando clientes..."
                    />
                  </ListItem>
                )}
                {chats.map((chat) => (
                  <ListItemButton 
                    key={chat.id}
                    selected={selectedChat?.id === chat.id}
                    onClick={() => setSelectedChat(chat)}
                    sx={{
                      borderBottom: '1px solid #eee',
                      '&:hover': { bgcolor: '#f5f5f5' }
                    }}
                  >
                    <Avatar sx={{ mr: 2, bgcolor: '#B8860B' }}>
                      {chat.userName?.[0] || 'C'}
                    </Avatar>
                    <ListItemText
                      primary={chat.userName || 'Cliente'}
                      secondary={chat.userEmail || ''}
                      primaryTypographyProps={{ fontWeight: 'bold' }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Paper>
          </Grid>

          {/* Área de mensagens */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ 
              height: { xs: '500px', md: '100%' }, 
              display: 'flex', 
              flexDirection: 'column'
            }}>
              {selectedChat ? (
                <>
                  {/* Cabeçalho do chat */}
                  <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderBottom: '1px solid #ddd' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {selectedChat.userName || 'Cliente'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {selectedChat.userEmail}
                    </Typography>
                  </Box>

                  {/* Mensagens */}
                  <Box sx={{ 
                    flexGrow: 1, 
                    overflowY: 'auto', 
                    p: 2, 
                    bgcolor: '#fafafa',
                    height: { xs: '350px', md: 'auto' }
                  }}>
                    {chatMessages.map((msg, index) => (
                      <Box
                        key={index}
                        sx={{
                          display: 'flex',
                          justifyContent: msg.sender === 'admin' ? 'flex-end' : 'flex-start',
                          mb: 2
                        }}
                      >
                        <Box
                          sx={{
                            maxWidth: '70%',
                            bgcolor: msg.sender === 'admin' ? '#1976d2' : '#fff',
                            color: msg.sender === 'admin' ? '#fff' : '#000',
                            p: 1.5,
                            borderRadius: 2,
                            boxShadow: 1
                          }}
                        >
                          <Typography variant="body2">{msg.text}</Typography>
                          <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', mt: 0.5 }}>
                            {msg.timestamp?.toDate ? msg.timestamp.toDate().toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'}) : ''}
                          </Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>

                  {/* Campo de envio */}
                  <Box sx={{ p: 2, borderTop: '1px solid #ddd', bgcolor: '#fff' }}>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        fullWidth
                        placeholder="Digite sua resposta..."
                        value={adminMessage}
                        onChange={(e) => setAdminMessage(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') sendAdminMessage();
                        }}
                        size="small"
                      />
                      <Button
                        variant="contained"
                        onClick={sendAdminMessage}
                        endIcon={<SendIcon />}
                        disabled={!adminMessage.trim()}
                      >
                        Enviar
                      </Button>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                  <Typography variant="h6" color="text.secondary">
                    Selecione uma conversa
                  </Typography>
                </Box>
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({...notification, open: false})}>
        <Alert severity={notification.severity}>{notification.message}</Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminDashboard;