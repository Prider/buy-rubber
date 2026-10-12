interface LogoProps {
  className?: string;
  alt?: string;
}

export default function Logo({
  className = 'h-10 w-10',
  alt = 'Yang Dee',
}: LogoProps) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={`relative inline-flex aspect-square shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 shadow-sm ${className}`}
    >
      <span
        aria-hidden="true"
        className="block h-[68%] aspect-[603/898] bg-white"
        style={{
          WebkitMaskImage: 'url(/logo.png?v=2)',
          maskImage: 'url(/logo.png?v=2)',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
        }}
      />
    </span>
  );
}
