import * as React from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

type ToastInput = Omit<Toast, "id">;

const listeners: ((toasts: Toast[]) => void)[] = [];
let toasts: Toast[] = [];

function dispatch(toast: Toast) {
  toasts = [toast, ...toasts].slice(0, 3);
  listeners.forEach((l) => l(toasts));
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== toast.id);
    listeners.forEach((l) => l(toasts));
  }, 4000);
}

export function toast(input: ToastInput) {
  dispatch({ ...input, id: Math.random().toString(36).slice(2) });
}

export function useToast() {
  const [state, setState] = React.useState<Toast[]>(toasts);
  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const i = listeners.indexOf(setState);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { toasts: state };
}