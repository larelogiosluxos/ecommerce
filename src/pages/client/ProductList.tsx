import { useEffect, useState } from 'react';
import { db } from '../../Firebase';
import { collection, getDocs } from 'firebase/firestore';
import { 
  Container, Card, CardMedia, CardContent, 
  Typography, Button, Box, CircularProgress, Divider, Tabs, Tab 
} from '@mui/material';
import Grid from '@mui/material/Grid';

interface Watch {
  id: string;
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  description: string;
  featured: boolean;
  category: string; // Adicionado para suportar categorias
}

const ProductList = ({ onAddToCart }: { onAddToCart: (p: any) => void }) => {
  const [allProducts, setAllProducts] = useState<Watch[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Watch[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Watch[]>([]);
  const [selectedTab, setSelectedTab] = useState('Todos');
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "products"));
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Watch[];

      setAllProducts(docs);
      setFilteredProducts(docs);
      setFeaturedProducts(docs.filter(p => p.featured === true));
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Lógica de Filtro por Categoria
  const handleTabChange = (_event: React.SyntheticEvent, newValue: string) => {
    setSelectedTab(newValue);
    if (newValue === 'Todos') {
      setFilteredProducts(allProducts);
    } else {
      setFilteredProducts(allProducts.filter(p => p.category === newValue));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  const ProductCard = ({ product }: { product: Watch }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative', borderRadius: 2 }}>
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
        height="260"
        image={product.imageUrl || 'https://via.placeholder.com/300x300?text=Relógio'}
        alt={product.name}
        sx={{ objectFit: 'cover' }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="overline" color="text.secondary">{product.brand}</Typography>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1 }}>
          {product.name}
        </Typography>
        <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
          R$ {product.price?.toLocaleString('pt-BR')}
        </Typography>
      </CardContent>
      <Box sx={{ p: 2, pt: 0 }}>
            <Button 
              fullWidth 
              variant="contained" 
              onClick={() => onAddToCart(product)} // <--- Adicione isso
              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 'bold' }}
            >
              Adicionar ao Carrinho
            </Button>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* SEÇÃO DE DESTAQUES (Só aparece na aba "Todos") */}
      {selectedTab === 'Todos' && featuredProducts.length > 0 && (
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold' }}>⭐ Destaques</Typography>
          <Grid container spacing={3}>
            {featuredProducts.map((p) => (
              /* RESOLUÇÃO DO ERRO: Usando size em vez de item/xs */
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 6 }} />
        </Box>
      )}

      {/* MENU DE CATEGORIAS */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 4 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 'bold' }}>Categorias</Typography>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          sx={{ '& .MuiTab-root': { fontWeight: 'bold' } }}
        >
          <Tab label="Todos" value="Todos" />
          <Tab label="Masculino" value="Masculino" />
          <Tab label="Feminino" value="Feminino" />
          <Tab label="Luxo" value="Luxo" />
          <Tab label="Esportivo" value="Esportivo" />
        </Tabs>
      </Box>

      {/* LISTAGEM DE PRODUTOS FILTRADOS */}
      <Grid container spacing={3}>
        {filteredProducts.map((p) => (
          /* RESOLUÇÃO DO ERRO: Usando size em vez de item/xs */
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum relógio disponível nesta categoria no momento.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ProductList;