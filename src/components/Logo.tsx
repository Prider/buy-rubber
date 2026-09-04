interface LogoProps {
  className?: string;
  alt?: string;
}

export default function Logo({
  className = 'h-10 w-auto',
  alt = 'Punsook Innotech',
}: LogoProps) {
  return (
    <img
      src="/logo.png"
      alt={alt}
      className={`object-contain [image-rendering:pixelated] ${className}`}
    />
  );
}
