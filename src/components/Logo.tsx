interface LogoProps {
  className?: string;
  alt?: string;
}

const logoColor = 'bg-black dark:bg-white';

export default function Logo({
  className = 'h-10 w-10',
  alt = 'Yang Dee',
}: LogoProps) {
  return (
    <span
      role="img"
      aria-label={alt}
      className={`relative inline-flex aspect-square shrink-0 items-center justify-center ${className}`}
    >
      <span
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 rounded-full p-[2px] ${logoColor}`}
        style={{
          WebkitMask:
            'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />
      <span
        aria-hidden="true"
        className={`block h-[68%] aspect-[603/898] ${logoColor}`}
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
