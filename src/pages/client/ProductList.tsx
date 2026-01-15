import { useEffect, useState } from 'react';
import { db } from '../../Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  Container, Card, CardMedia, CardContent, 
  Typography, Button, Box, CircularProgress, Divider, Tabs, Tab 
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Usando Grid2 para melhor compatibilidade
import { useNavigate } from 'react-router-dom';

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

const categories = ["Todos", "Masculino", "Feminino", "Luxo", "Esportivo"];

const ProductList = ({ onAddToCart }: { onAddToCart: (p: any) => void }) => {
  const [allProducts, setAllProducts] = useState<Watch[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Watch[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Watch[]>([]);
  const [selectedTab, setSelectedTab] = useState('Todos');
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  // Componente interno para o Card do Produto
  const ProductCard = ({ product }: { product: Watch }) => (
    <Card sx={{ 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column', 
      position: 'relative', 
      borderRadius: 3,
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
      }
    }}>
      {product.featured && (
        <Box sx={{ 
          position: 'absolute', top: 12, left: 12, zIndex: 1,
          bgcolor: '#B8860B', color: '#fff', px: 1.5, py: 0.5, borderRadius: 1, 
          fontWeight: 'bold', fontSize: '0.65rem', boxShadow: 2
        }}>
          DESTAQUE
        </Box>
      )}
      
      <CardMedia
        component="img"
        height="260"
        image={product.imageUrl || 'https://via.placeholder.com/400x400?text=La+Relogios'}
        alt={product.name}
        onClick={() => navigate(`/produto/${product.id}`)}
        sx={{ cursor: 'pointer', objectFit: 'cover' }}
      />

      <CardContent 
        sx={{ flexGrow: 1, cursor: 'pointer' }}
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 'bold' }}>
          {product.brand}
        </Typography>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', lineHeight: 1.2, mb: 1, height: '2.8em', overflow: 'hidden' }}>
          {product.name}
        </Typography>
        <Typography variant="h6" sx={{ color: '#B8860B', fontWeight: 'bold' }}>
          R$ {product.price?.toLocaleString('pt-BR')}
        </Typography>
      </CardContent>

      <Box sx={{ p: 2, pt: 0 }}>
        <Button 
          fullWidth 
          variant="contained" 
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(product);
          }}
          sx={{ 
            borderRadius: 2, 
            textTransform: 'none', 
            fontWeight: 'bold',
            bgcolor: '#000',
            '&:hover': { bgcolor: '#B8860B' }
          }}
        >
          Adicionar ao Carrinho
        </Button>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      
      {/* SEÇÃO DE DESTAQUES */}
      {selectedTab === 'Todos' && featuredProducts.length > 0 && (
        <Box sx={{ mb: 8 }}>
          <Typography variant="h4" sx={{ mb: 4, fontWeight: 'bold', textAlign: 'center' }}>
            Peças de Destaque
          </Typography>
          <Grid container spacing={4}>
            {featuredProducts.map((p) => (
              <Grid key={p.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: 8 }} />
        </Box>
      )}

      {/* MENU DE CATEGORIAS */}
      <Box sx={{ mb: 6 }}>
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>Nossa Coleção</Typography>
        <Tabs 
          value={selectedTab} 
          onChange={handleTabChange} 
          variant="scrollable"
          scrollButtons="auto"
          textColor="primary"
          indicatorColor="primary"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            '& .MuiTab-root': { fontWeight: 'bold', fontSize: '1rem', textTransform: 'none' }
          }}
        >
          {categories.map((cat) => (
            <Tab key={cat} label={cat} value={cat} />
          ))}
        </Tabs>
      </Box>

      {/* LISTAGEM PRINCIPAL */}
      <Grid container spacing={3}>
        {filteredProducts.map((p) => (
          <Grid key={p.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h6" color="text.secondary">
            Nenhum relógio encontrado nesta categoria.
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default ProductList;