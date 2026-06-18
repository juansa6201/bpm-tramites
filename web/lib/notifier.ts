import type { VariantType } from 'notistack';

/**
 * Puente entre código que NO es React (el api-client) y los providers de React.
 *
 * El api-client no puede usar hooks (useSnackbar, useRouter). En su lugar, el
 * SnackbarProvider y el AuthProvider registran acá sus callbacks al montarse,
 * y el api-client los invoca. Así la lógica de errores vive en un solo lugar.
 */

type NotifyFn = (message: string, variant: VariantType) => void;
type UnauthorizedFn = () => void;

let notifyFn: NotifyFn | null = null;
let unauthorizedFn: UnauthorizedFn | null = null;

export function registerNotifier(fn: NotifyFn): void {
  notifyFn = fn;
}

/** Muestra un snackbar (no-op si el provider aún no se montó). */
export function notify(message: string, variant: VariantType = 'error'): void {
  notifyFn?.(message, variant);
}

export function registerUnauthorizedHandler(fn: UnauthorizedFn): void {
  unauthorizedFn = fn;
}

/** Dispara el flujo de sesión expirada (lo maneja el AuthProvider: limpia + redirige). */
export function triggerUnauthorized(): void {
  unauthorizedFn?.();
}
