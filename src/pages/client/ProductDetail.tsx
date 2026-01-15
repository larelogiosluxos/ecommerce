import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../Firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Container, Typography, Button, Box, CircularProgress, Paper, Divider, Chip 
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Usando Grid2 para evitar o erro de 'item'
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';

const ProductDetail = ({ onAddToCart }: any) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mainImage, setMainImage] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProduct({ id: docSnap.id, ...data });
          setMainImage(data.imageUrl);
        }
      } catch (error) {
        console.error("Erro ao buscar produto:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  if (!product) return <Typography sx={{ mt: 10, textAlign: 'center' }}>Produto não encontrado.</Typography>;

  // Lista de imagens (a principal + as extras se existirem no array 'images')
  const allImages = product.images ? [product.imageUrl, ...product.images] : [product.imageUrl];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')} 
        sx={{ mb: 3, color: 'gray', textTransform: 'none' }}
      >
        Voltar para a Coleção
      </Button>

      <Grid container spacing={4}>
        {/* LADO ESQUERDO: Galeria de Fotos (Tamanho reduzido) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 4, 
              overflow: 'hidden', 
              border: '1px solid #eee', 
              bgcolor: '#fff', 
              mb: 2,
              height: '400px', // Altura fixa para controlar o tamanho
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <img 
              src={mainImage} 
              alt={product.name} 
              style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }} 
            />
          </Paper>

          {/* Miniaturas da Galeria */}
          <Box sx={{ display: 'flex', gap: 1, overflowX: 'auto', pb: 1 }}>
            {allImages.map((img, index) => (
              <Box 
                key={index}
                onClick={() => setMainImage(img)}
                sx={{ 
                  width: 70, 
                  height: 70, 
                  borderRadius: 2, 
                  cursor: 'pointer',
                  border: mainImage === img ? '2px solid #B8860B' : '1px solid #eee',
                  overflow: 'hidden', 
                  flexShrink: 0,
                  transition: '0.2s',
                  '&:hover': { transform: 'scale(1.05)' }
                }}
              >
                <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Box>
        </Grid>

        {/* LADO DIREITO: Informações */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Box sx={{ pl: { md: 2 } }}>
            <Typography variant="overline" color="primary" sx={{ fontWeight: 'bold' }}>
              {product.brand}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {product.name}
            </Typography>
            
            <Chip label={product.category} variant="outlined" size="small" sx={{ mb: 2 }} />

            <Typography variant="h5" sx={{ color: '#B8860B', fontWeight: 'bold', mb: 3 }}>
              R$ {product.price?.toLocaleString('pt-BR')}
            </Typography>

            <Divider sx={{ mb: 3 }} />

            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>Descrição</Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, whiteSpace: 'pre-line', lineHeight: 1.6 }}>
              {product.description}
            </Typography>

            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              startIcon={<ShoppingCartIcon />}
              onClick={() => onAddToCart(product)}
              sx={{ 
                py: 2, 
                bgcolor: '#000', 
                fontWeight: 'bold',
                '&:hover': { bgcolor: '#B8860B' }
              }}
            >
              Adicionar ao Carrinho
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProductDetail;