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
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      <Button 
        startIcon={<ArrowBackIcon />} 
        onClick={() => navigate('/')} 
        sx={{ 
          mb: { xs: 2, sm: 2.5, md: 3 }, 
          color: 'gray', 
          textTransform: 'none',
          fontSize: { xs: '0.85rem', sm: '0.9rem', md: '1rem' }
        }}
      >
        Voltar para a Coleção
      </Button>

      <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
        {/* LADO ESQUERDO: Galeria de Fotos (Tamanho reduzido) */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: { xs: 2, sm: 3, md: 4 }, 
              overflow: 'hidden', 
              border: '1px solid #eee', 
              bgcolor: '#fff', 
              mb: { xs: 1.5, sm: 2 },
              height: { xs: '280px', sm: '350px', md: '400px' },
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
          <Box sx={{ display: 'flex', gap: { xs: 0.75, sm: 1 }, overflowX: 'auto', pb: 1 }}>
            {allImages.map((img, index) => (
              <Box 
                key={index}
                onClick={() => setMainImage(img)}
                sx={{ 
                  width: { xs: 55, sm: 65, md: 70 }, 
                  height: { xs: 55, sm: 65, md: 70 }, 
                  borderRadius: { xs: 1.5, sm: 2 }, 
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
            <Typography 
              variant="overline" 
              color="primary" 
              sx={{ 
                fontWeight: 'bold',
                fontSize: { xs: '0.7rem', sm: '0.75rem' }
              }}
            >
              {product.brand}
            </Typography>
            <Typography 
              variant="h4" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                fontSize: { xs: '1.5rem', sm: '1.8rem', md: '2.125rem' }
              }}
            >
              {product.name}
            </Typography>
            
            <Chip 
              label={product.category} 
              variant="outlined" 
              size="small" 
              sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '0.7rem', sm: '0.75rem' },
                height: { xs: 22, sm: 24 }
              }} 
            />

            <Typography 
              variant="h5" 
              sx={{ 
                color: '#B8860B', 
                fontWeight: 'bold', 
                mb: { xs: 2, sm: 2.5, md: 3 },
                fontSize: { xs: '1.4rem', sm: '1.6rem', md: '1.75rem' }
              }}
            >
              R$ {product.price?.toLocaleString('pt-BR')}
            </Typography>

            <Divider sx={{ mb: { xs: 2, sm: 2.5, md: 3 } }} />

            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 'bold', 
                mb: 1,
                fontSize: { xs: '1.1rem', sm: '1.2rem', md: '1.25rem' }
              }}
            >
              Descrição
            </Typography>
            <Typography 
              variant="body1" 
              color="text.secondary" 
              sx={{ 
                mb: { xs: 3, sm: 3.5, md: 4 }, 
                whiteSpace: 'pre-line', 
                lineHeight: 1.6,
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' }
              }}
            >
              {product.description}
            </Typography>

            <Button 
              variant="contained" 
              fullWidth 
              size="large" 
              startIcon={<ShoppingCartIcon sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />}
              onClick={() => onAddToCart(product)}
              sx={{ 
                py: { xs: 1.5, sm: 1.75, md: 2 }, 
                bgcolor: '#000', 
                fontWeight: 'bold',
                fontSize: { xs: '0.9rem', sm: '0.95rem', md: '1rem' },
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