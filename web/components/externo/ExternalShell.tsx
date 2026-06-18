'use client';

import * as React from 'react';
import Link from 'next/link';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import LogoutIcon from '@mui/icons-material/Logout';
import { useExternalAuth } from '@/context/ExternalAuthContext';

/**
 * Layout visual del portal EXTERNO: header simple (SIN navegación de áreas) y
 * contenido centrado en un contenedor angosto. La paleta teal del theme externo
 * lo diferencia a primera vista del portal interno.
 */
export function ExternalShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useExternalAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const initial = (user?.nombre ?? user?.email ?? '?').charAt(0).toUpperCase();

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" noWrap sx={{ mr: 3 }}>
            Portal externo
          </Typography>

          <Stack direction="row" spacing={1} sx={{ display: { xs: 'none', sm: 'flex' } }}>
            <Button color="inherit" component={Link} href="/externo/tramites">
              Mis trámites
            </Button>
            <Button color="inherit" component={Link} href="/externo/tramites/nuevo">
              Nuevo trámite
            </Button>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
              <Typography variant="body2" lineHeight={1.2}>
                {user?.nombre ?? user?.email}
              </Typography>
              {user?.nombre && (
                <Typography variant="caption" sx={{ opacity: 0.85 }}>
                  {user.email}
                </Typography>
              )}
            </Box>
            <IconButton
              color="inherit"
              aria-label="cuenta"
              onClick={(e) => setAnchorEl(e.currentTarget)}
            >
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>{initial}</Avatar>
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={() => setAnchorEl(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
              <MenuItem disabled>{user?.email}</MenuItem>
              <Divider />
              <MenuItem
                onClick={() => {
                  setAnchorEl(null);
                  logout();
                }}
              >
                <ListItemIcon>
                  <LogoutIcon fontSize="small" />
                </ListItemIcon>
                Cerrar sesión
              </MenuItem>
            </Menu>
          </Box>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" component="main" sx={{ py: 3 }}>
        {/* Empuja el contenido debajo del AppBar fijo */}
        <Toolbar />
        {children}
      </Container>
    </Box>
  );
}
