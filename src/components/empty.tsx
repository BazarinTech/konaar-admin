export function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-muted-foreground flex items-center justify-center rounded-lg border border-dashed px-6 py-10 text-sm">
      {children}
    </div>
  );
}
