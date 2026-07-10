import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts } = useToast();
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "min-w-[300px] rounded-lg border p-4 shadow-lg",
            t.variant === "destructive"
              ? "border-red-200 bg-red-50 text-red-800"
              : "border-gray-200 bg-white text-gray-900"
          )}
        >
          {t.title && (
            <p className="text-sm font-semibold">{t.title}</p>
          )}
          {t.description && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {t.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}