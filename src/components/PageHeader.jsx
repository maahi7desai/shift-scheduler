export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between gap-3 mb-5">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight font-heading">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}