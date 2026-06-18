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
import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import Switch from '@mui/material/Switch';
import TextField from '@mui/material/TextField';
import { crearTipoTramite, actualizarTipoTramite } from '@/lib/config-api';
import { useNotify } from '@/context/SnackbarContext';
import type { Area } from '@/types/tramite';
import type { TipoTramite } from '@/types/config';

const schema = Yup.object({
  codigo: Yup.string().trim().required('El código es obligatorio'),
  nombre: Yup.string().trim().required('El nombre es obligatorio'),
  slaHoras: Yup.number()
    .typeError('Debe ser un número')
    .integer('Debe ser entero')
    .min(0, 'No puede ser negativo')
    .required('El SLA es obligatorio'),
  descripcion: Yup.string(),
  areaInicialId: Yup.string(),
  activo: Yup.boolean().required(),
  requiereExterno: Yup.boolean().required(),
  permiteInicioExterno: Yup.boolean().required(),
});

interface Props {
  /** null = alta; un tipo = edición. undefined = dialog cerrado. */
  tipo: TipoTramite | null | undefined;
  areas: Area[];
  onClose: () => void;
  onSaved: () => void;
}

export function TipoTramiteFormDialog({ tipo, areas, onClose, onSaved }: Props) {
  const notify = useNotify();
  const editando = Boolean(tipo);

  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      codigo: tipo?.codigo ?? '',
      nombre: tipo?.nombre ?? '',
      slaHoras: tipo?.slaHoras ?? 24,
      descripcion: tipo?.descripcion ?? '',
      areaInicialId: tipo?.areaInicialId ?? '',
      activo: tipo?.activo ?? true,
      requiereExterno: tipo?.requiereExterno ?? false,
      permiteInicioExterno: tipo?.permiteInicioExterno ?? false,
    },
    validationSchema: schema,
    onSubmit: async (values, { setSubmitting }) => {
      const comun = {
        nombre: values.nombre.trim(),
        slaHoras: Number(values.slaHoras),
        descripcion: values.descripcion.trim() || undefined,
        areaInicialId: values.areaInicialId || undefined,
        activo: values.activo,
        requiereExterno: values.requiereExterno,
        permiteInicioExterno: values.permiteInicioExterno,
      };
      try {
        if (tipo) {
          await actualizarTipoTramite(tipo.id, comun);
          notify('Tipo de trámite actualizado.', 'success');
        } else {
          await crearTipoTramite({ ...comun, codigo: values.codigo.trim() });
          notify('Tipo de trámite creado.', 'success');
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
      open={tipo !== undefined}
      onClose={formik.isSubmitting ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{editando ? 'Editar tipo de trámite' : 'Nuevo tipo de trámite'}</DialogTitle>
      <form onSubmit={formik.handleSubmit} noValidate>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField
                name="codigo"
                label="Código"
                value={formik.values.codigo}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.codigo && Boolean(formik.errors.codigo)}
                helperText={
                  (formik.touched.codigo && formik.errors.codigo) ||
                  (editando ? 'No se puede cambiar' : ' ')
                }
                disabled={formik.isSubmitting || editando}
                fullWidth
              />
              <TextField
                name="slaHoras"
                label="SLA (horas)"
                type="number"
                value={formik.values.slaHoras}
                onChange={formik.handleChange}
                onBlur={formik.handleBlur}
                error={formik.touched.slaHoras && Boolean(formik.errors.slaHoras)}
                helperText={formik.touched.slaHoras && formik.errors.slaHoras}
                disabled={formik.isSubmitting}
                fullWidth
              />
            </Stack>

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
              name="descripcion"
              label="Descripción (opcional)"
              value={formik.values.descripcion}
              onChange={formik.handleChange}
              disabled={formik.isSubmitting}
              multiline
              minRows={2}
              fullWidth
            />

            <TextField
              select
              name="areaInicialId"
              label="Área inicial (opcional)"
              value={formik.values.areaInicialId}
              onChange={formik.handleChange}
              disabled={formik.isSubmitting}
              fullWidth
            >
              <MenuItem value="">
                <em>Sin área inicial</em>
              </MenuItem>
              {areas.map((a) => (
                <MenuItem key={a.id} value={a.id}>
                  {a.nombre}
                </MenuItem>
              ))}
            </TextField>

            <FormControlLabel
              control={
                <Switch
                  name="activo"
                  checked={formik.values.activo}
                  onChange={formik.handleChange}
                  disabled={formik.isSubmitting}
                />
              }
              label="Activo"
            />
            <FormControlLabel
              control={
                <Switch
                  name="requiereExterno"
                  checked={formik.values.requiereExterno}
                  onChange={formik.handleChange}
                  disabled={formik.isSubmitting}
                />
              }
              label="Requiere externo"
            />
            <FormControlLabel
              control={
                <Switch
                  name="permiteInicioExterno"
                  checked={formik.values.permiteInicioExterno}
                  onChange={formik.handleChange}
                  disabled={formik.isSubmitting}
                />
              }
              label="Permite inicio externo"
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
