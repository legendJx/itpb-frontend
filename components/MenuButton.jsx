import Link from "next/link";

const variants = {
  primary: "bg-itpb-orange text-white shadow-md hover:brightness-110",
  secondary:
    "border-2 border-itpb-navy bg-white text-itpb-navy hover:bg-itpb-navy hover:text-white",
};

export default function MenuButton({
  href,
  label,
  description,
  icon,
  variant = "primary",
  comingSoon = false,
}) {
  const content = (
    <>
      {icon && (
        <span className="text-2xl" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="flex flex-1 flex-col text-left">
        <span className="text-lg font-bold">{label}</span>
        {description && (
          <span className="text-sm font-medium opacity-80">{description}</span>
        )}
      </span>
      {comingSoon && (
        <span className="rounded-full bg-itpb-navy/10 px-2 py-0.5 text-xs font-bold uppercase tracking-wide">
          Soon
        </span>
      )}
    </>
  );

  const base = "flex w-full items-center gap-4 rounded-2xl px-6 py-4 transition";

  if (comingSoon) {
    return (
      <div
        aria-disabled="true"
        className={`${base} cursor-not-allowed border-2 border-itpb-navy/20 bg-white text-itpb-navy/50`}
      >
        {content}
      </div>
    );
  }

  return (
    <Link href={href} className={`${base} ${variants[variant]} active:scale-95`}>
      {content}
    </Link>
  );
}
