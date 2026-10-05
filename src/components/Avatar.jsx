export default function Avatar({ name = '', size = 40 }) {
  const initial = (name.trim().charAt(0) || '?').toUpperCase();
  return (
    <div
      className="rounded-full bg-muted text-foreground font-semibold flex items-center justify-center flex-shrink-0 select-none"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initial}
    </div>
  );
}