import { useEffect, useState } from 'react';
import { db } from '../../Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Container, Card, CardMedia, CardContent, 
  Typography, Button, Box, CircularProgress, Divider 
} from '@mui/material';
// Usando a importação estável para evitar erros de versão
import Grid from '@mui/material/Grid';

interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  description: string;
  featured: boolean;
}

const ProductList = () => {
  const [featuredProducts, setFeaturedProducts] = useState<Watch[]>([]);
  const [allProducts, setAllProducts] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Watch[];

      // Separa os produtos entre destaques e normais
      setFeaturedProducts(docs.filter(p => p.featured === true));
      setAllProducts(docs.filter(p => !p.featured));
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Componente interno para o Card (evita repetição de código)
  const ProductCard = ({ product }: { product: Watch }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {product.featured && (
        <Box sx={{ 
          position: 'absolute', top: 10, left: 10, zIndex: 1,
          bgcolor: '#fbc02d', color: '#000', px: 1, borderRadius: 1, 
          fontWeight: 'bold', fontSize: '0.7rem' 
        }}>
          DESTAQUE
        </Box>
      )}
      <CardMedia
        component="img"
        height="240"
        image={product.imageUrl || 'https://via.placeholder.com/300x300?text=Relógio'}
        alt={product.name}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="overline" color="text.secondary">{product.brand}</Typography>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
          {product.name}
        </Typography>
        <Typography variant="h6" color="primary">
          R$ {product.price?.toLocaleString('pt-BR')}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
        <Button fullWidth variant="contained" color="primary">Comprar Agora</Button>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* SEÇÃO DE DESTAQUES */}
      {featuredProducts.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>⭐ Destaques</Typography>
          <Grid container spacing={3}>
            {featuredProducts.map((p) => (
              /* Correção do erro: removido 'item' e usado sx para largura */
              <Grid key={p.id} sx={{ width: { xs: '100%', sm: '50%', md: '33.33%' }, px: 1.5 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 6 }} />
        </Box>
      )}

      {/* SEÇÃO COMPLETA */}
      <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', mt: 4 }}>Nossa Coleção</Typography>
      <Grid container spacing={3}>
        {allProducts.map((p) => (
          <Grid key={p.id} sx={{ width: { xs: '100%', sm: '50%', md: '25%' }, px: 1.5 }}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>

      {featuredProducts.length === 0 && allProducts.length === 0 && (
        <Typography sx={{ textAlign: 'center', mt: 10 }}>Nenhum relógio disponível.</Typography>
      )}
    </Container>
  );
};

export default ProductList;