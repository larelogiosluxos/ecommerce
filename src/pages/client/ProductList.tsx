import { useEffect, useState } from 'react';
import { db } from '../../Firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { 
  Container, Card, CardMedia, CardContent, 
  Typography, Button, Box, CircularProgress, Divider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { useNavigate, useSearchParams } from 'react-router-dom';

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

const ProductList = ({ onAddToCart }: { onAddToCart: (p: any) => void }) => {
  const [allProducts, setAllProducts] = useState<Watch[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Watch[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Watch[]>([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const fetchData = async () => {
    try {
      const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Watch[];

      setAllProducts(docs);
      setFeaturedProducts(docs.filter(p => p.featured === true));
      
      // Verifica se há parâmetro de categoria na URL
      const categoriaUrl = searchParams.get('categoria');
      if (categoriaUrl) {
        setFilteredProducts(docs.filter(p => p.category === categoriaUrl));
      } else {
        setFilteredProducts(docs);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Atualiza quando a URL muda
  useEffect(() => {
    const categoriaUrl = searchParams.get('categoria');
    const buscaUrl = searchParams.get('busca');
    
    let produtosFiltrados = allProducts;
    
    // Filtro por categoria
    if (categoriaUrl) {
      produtosFiltrados = produtosFiltrados.filter(p => p.category === categoriaUrl);
    }
    
    // Filtro por busca (nome, marca ou descrição)
    if (buscaUrl) {
      const termoBusca = buscaUrl.toLowerCase().trim();
      produtosFiltrados = produtosFiltrados.filter(p => 
        p.name.toLowerCase().includes(termoBusca) ||
        p.brand.toLowerCase().includes(termoBusca) ||
        p.description?.toLowerCase().includes(termoBusca) ||
        p.category?.toLowerCase().includes(termoBusca)
      );
    }
    
    setFilteredProducts(produtosFiltrados);
  }, [searchParams, allProducts]);

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
      borderRadius: { xs: 2, md: 3 },
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': {
        transform: 'translateY(-5px)',
        boxShadow: '0 8px 20px rgba(0,0,0,0.1)'
      }
    }}>
      {product.featured && (
        <Box sx={{ 
          position: 'absolute', top: { xs: 6, sm: 12 }, left: { xs: 6, sm: 12 }, zIndex: 1,
          bgcolor: '#B8860B', color: '#fff', px: { xs: 1, sm: 1.5 }, py: 0.5, borderRadius: 1, 
          fontWeight: 'bold', fontSize: { xs: '0.55rem', sm: '0.65rem' }, boxShadow: 2
        }}>
          DESTAQUE
        </Box>
      )}
      
      <CardMedia
        component="img"
        height="auto"
        image={product.imageUrl || 'https://via.placeholder.com/400x400?text=La+Relogios'}
        alt={product.name}
        onClick={() => navigate(`/produto/${product.id}`)}
        sx={{ 
          cursor: 'pointer', 
          objectFit: 'cover',
          aspectRatio: '1',
          maxHeight: { xs: '180px', sm: '220px', md: '260px' }
        }}
      />

      <CardContent 
        sx={{ 
          flexGrow: 1, 
          cursor: 'pointer',
          p: { xs: 1.5, sm: 2 },
          '&:last-child': { pb: { xs: 1.5, sm: 2 } }
        }}
        onClick={() => navigate(`/produto/${product.id}`)}
      >
        <Typography 
          variant="overline" 
          color="text.secondary" 
          sx={{ 
            fontWeight: 'bold',
            fontSize: { xs: '0.65rem', sm: '0.75rem' },
            lineHeight: 1
          }}
        >
          {product.brand}
        </Typography>
        <Typography 
          variant="h6" 
          component="h2" 
          sx={{ 
            fontWeight: 'bold', 
            lineHeight: 1.2, 
            mb: 1, 
            height: { xs: '2.5em', sm: '2.8em' }, 
            overflow: 'hidden',
            fontSize: { xs: '0.95rem', sm: '1.1rem', md: '1.25rem' }
          }}
        >
          {product.name}
        </Typography>
        <Typography 
          variant="h6" 
          sx={{ 
            color: '#B8860B', 
            fontWeight: 'bold',
            fontSize: { xs: '1rem', sm: '1.15rem', md: '1.25rem' }
          }}
        >
          R$ {product.price?.toLocaleString('pt-BR')}
        </Typography>
      </CardContent>

      <Box sx={{ p: { xs: 1.5, sm: 2 }, pt: 0 }}>
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
            fontSize: { xs: '0.8rem', sm: '0.875rem', md: '1rem' },
            py: { xs: 0.8, sm: 1 },
            '&:hover': { bgcolor: '#B8860B' }
          }}
        >
          Adicionar
        </Button>
      </Box>
    </Card>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: { xs: 2, sm: 3, md: 4 }, mb: { xs: 4, sm: 6, md: 8 }, px: { xs: 2, sm: 3 } }}>
      
      {/* SEÇÃO DE DESTAQUES */}
      {!searchParams.get('categoria') && !searchParams.get('busca') && featuredProducts.length > 0 && (
        <Box sx={{ mb: { xs: 4, sm: 6, md: 8 } }}>
          <Typography 
            variant="h4" 
            sx={{ 
              mb: { xs: 2, sm: 3, md: 4 }, 
              fontWeight: 'bold', 
              textAlign: 'center',
              fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
            }}
          >
            Peças de Destaque
          </Typography>
          <Grid container spacing={{ xs: 2, sm: 3, md: 4 }}>
            {featuredProducts.map((p) => (
              <Grid key={p.id} size={{ xs: 6, sm: 6, md: 4 }}>
                <ProductCard product={p} />
              </Grid>
            ))}
          </Grid>
          <Divider sx={{ mt: { xs: 4, sm: 6, md: 8 } }} />
        </Box>
      )}

      {/* TÍTULO DA SEÇÃO - Apenas quando houver categoria */}
      {searchParams.get('categoria') && (
        <Box sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: { xs: 2, sm: 2.5, md: 3 }, 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
              textAlign: 'center'
            }}
          >
            Categoria: {searchParams.get('categoria')}
          </Typography>
        </Box>
      )}

      {/* TÍTULO DE BUSCA */}
      {searchParams.get('busca') && (
        <Box sx={{ mb: { xs: 3, sm: 4, md: 6 } }}>
          <Typography 
            variant="h5" 
            sx={{ 
              mb: { xs: 1, sm: 1.5, md: 2 }, 
              fontWeight: 'bold',
              fontSize: { xs: '1.25rem', sm: '1.4rem', md: '1.5rem' },
              textAlign: 'center'
            }}
          >
            Resultados para: "{searchParams.get('busca')}"
          </Typography>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{ textAlign: 'center' }}
          >
            {filteredProducts.length} {filteredProducts.length === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </Typography>
        </Box>
      )}

      {/* LISTAGEM PRINCIPAL */}
      <Grid container spacing={{ xs: 2, sm: 2.5, md: 3 }}>
        {filteredProducts.map((p) => (
          <Grid key={p.id} size={{ xs: 6, sm: 6, md: 3 }}>
            <ProductCard product={p} />
          </Grid>
        ))}
      </Grid>

      {filteredProducts.length === 0 && (
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            {searchParams.get('busca') 
              ? `Nenhum relógio encontrado para "${searchParams.get('busca')}"` 
              : searchParams.get('categoria')
              ? `Nenhum relógio encontrado nesta categoria.`
              : 'Nenhum relógio disponível no momento.'}
          </Typography>
          {searchParams.get('busca') && (
            <Typography variant="body2" color="text.secondary">
              Tente usar outras palavras-chave ou navegar pelas categorias.
            </Typography>
          )}
        </Box>
      )}
    </Container>
  );
};

export default ProductList;