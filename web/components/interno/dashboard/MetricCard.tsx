'use client';

import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

interface Props {
  label: string;
  value: string | number;
  hint?: string;
}

export function MetricCard({ label, value, hint }: Props) {
  return (
    <Card variant="outlined" sx={{ minWidth: 180, flex: '1 1 180px' }}>
      <CardContent>
        <Typography variant="overline" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4">{value}</Typography>
        {hint && (
          <Typography variant="caption" color="text.secondary">
            {hint}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
