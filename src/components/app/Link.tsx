import { cn } from "@/lib/utils";

export function Link({
  href,
  className,
  children,
  onClick,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
  onClick?: (event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <a href={href} className={cn("text-primary no-underline hover:underline", className)} onClick={onClick}>
      {children}
    </a>
  );
}

export function ExternalLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("text-primary no-underline hover:underline", className)}
    >
      {children}
    </a>
  );
}
