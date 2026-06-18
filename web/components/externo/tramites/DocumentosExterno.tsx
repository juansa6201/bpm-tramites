'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import DownloadIcon from '@mui/icons-material/Download';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { formatDateTime } from '@/lib/format';
import type { Documento } from '@/types/tramite';

interface Props {
  documentos: Documento[];
  loading: boolean;
  error: boolean;
  onReload: () => void;
  /** Resuelve al subir; rechaza si falló (el api-client ya avisó). */
  onUpload: (file: File) => Promise<void>;
  onDownload: (doc: Documento) => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(0)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

export function DocumentosExterno({
  documentos,
  loading,
  error,
  onReload,
  onUpload,
  onDownload,
}: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-subir el mismo archivo
    if (!file) return;
    setUploading(true);
    try {
      await onUpload(file);
    } catch {
      // el api-client ya mostró el error
    } finally {
      setUploading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 2 }}>
        <input ref={inputRef} type="file" hidden onChange={onPick} />
        <Button
          variant="outlined"
          startIcon={
            uploading ? <CircularProgress size={18} color="inherit" /> : <UploadFileIcon />
          }
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
        >
          Adjuntar documento
        </Button>
      </Box>

      {loading && (
        <Stack spacing={1}>
          <Skeleton variant="rounded" height={48} />
          <Skeleton variant="rounded" height={48} />
        </Stack>
      )}

      {error && !loading && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={onReload}>
              Reintentar
            </Button>
          }
        >
          No se pudieron cargar los documentos.
        </Alert>
      )}

      {!loading && !error && documentos.length === 0 && (
        <Typography variant="body2" color="text.secondary">
          Todavía no hay documentos.
        </Typography>
      )}

      {!loading && !error && documentos.length > 0 && (
        <Stack spacing={1}>
          {documentos.map((d) => (
            <Paper
              key={d.id}
              variant="outlined"
              sx={{ p: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                <Typography variant="body2" noWrap title={d.nombreArchivo}>
                  {d.nombreArchivo}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {formatSize(d.size)} · {formatDateTime(d.fechaCarga)}
                </Typography>
              </Box>
              <Tooltip title="Descargar">
                <IconButton aria-label="descargar" onClick={() => onDownload(d)}>
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Paper>
          ))}
        </Stack>
      )}
    </Box>
  );
}
