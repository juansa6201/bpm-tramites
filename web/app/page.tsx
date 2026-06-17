import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Link from 'next/link';

export default function HomePage() {
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          BPM de Trámites
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Plataforma de gestión de trámites de oficina.
        </Typography>
        <Stack direction="row" spacing={2} justifyContent="center">
          <Button variant="contained" component={Link} href="/interno">
            Portal interno
          </Button>
          <Button variant="outlined" component={Link} href="/externo">
            Portal externo
          </Button>
        </Stack>
      </Box>
    </Container>
  );
}
