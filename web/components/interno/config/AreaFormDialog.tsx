'use client';

import * as React from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import FormControlLabel from '@mui/material/FormControlLabel';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { crearArea, actualizarArea } from '@/lib/config-api';
import { useNotify } from '@/context/SnackbarContext';
import type { Area } from '@/types/tramite';

const schema = Yup.object({
  nombre: Yup.string().trim().required('El nombre es obligatorio'),
  codigo: Yup.string().trim().required('El código es obligatorio'),
  activa: Yup.boolean().required(),
});

interface Props {
  /** null = alta; un área = edición. undefined = dialog cerrado. */
  area: Area | null | undefined;
  onClose: () => void;
  onSaved: () => void;
}

export function AreaFormDialog({ area, onClose, onSaved }: Props) {
  const notify = useNotify();
  const editando = Boolean(area);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      nombre: area?.nombre ?? '',
      codigo: area?.codigo ?? '',
      activa: area?.activa ?? true,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        if (area) {
          await actualizarArea(area.id, { nombre: values.nombre.trim(), activa: values.activa });
          notify('Área actualizada.', 'success');
        } else {
          await crearArea({
            nombre: values.nombre.trim(),
            codigo: values.codigo.trim(),
            activa: values.activa,
          });
          notify('Área creada.', 'success');
        }
        onSaved();
        onClose();
      } catch {
        // el api-client ya mostró el error (ej: código en uso)
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <Dialog
      open={area !== undefined}
      onClose={formik.isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{editando ? 'Editar área' : 'Nueva área'}</DialogTitle>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              name="nombre"
              label="Nombre"
              value={formik.values.nombre}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.nombre && Boolean(formik.errors.nombre)}
              helperText={formik.touched.nombre && formik.errors.nombre}
              disabled={formik.isSubmitting}
              fullWidth
            />
            <TextField
              name="codigo"
              label="Código"
              value={formik.values.codigo}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.codigo && Boolean(formik.errors.codigo)}
              helperText={
                (formik.touched.codigo && formik.errors.codigo) ||
                (editando ? 'El código no se puede cambiar' : ' ')
              }
              disabled={formik.isSubmitting || editando}
              fullWidth
            />
            <FormControlLabel
              control={
                <Switch
                  name="activa"
                  checked={formik.values.activa}
                  onChange={formik.handleChange}
                  disabled={formik.isSubmitting}
                />
              }
              label="Activa"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={formik.isSubmitting}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={formik.isSubmitting}
            startIcon={formik.isSubmitting ? <CircularProgress size={18} color="inherit" /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
