'use client';

import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { formatDate } from '@/lib/format';

interface Props {
  fechaVencimiento: string | null;
  vencido: boolean;
}

/** Muestra la fecha de vencimiento del SLA; si está vencido, en rojo con alerta. */
export function SlaBadge({ fechaVencimiento, vencido }: Props) {
  if (!fechaVencimiento) {
    return (
      <Typography variant="body2" color="text.disabled">
        —
      </Typography>
    );
  }

  const texto = formatDate(fechaVencimiento);

  if (!vencido) {
    return <Typography variant="body2">{texto}</Typography>;
  }

  return (
    <Tooltip title="SLA vencido">
      <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.5, color: 'error.main' }}>
        <WarningAmberIcon fontSize="small" />
        <Typography variant="body2" color="error" fontWeight={600}>
          {texto}
        </Typography>
      </Box>
    </Tooltip>
  );
}
