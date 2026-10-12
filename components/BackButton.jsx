import Link from "next/link";

export default function BackButton({ href = "/", label = "Back to Menu" }) {
  return (
    <Link
      href={href}
      className="text-sm font-bold text-itpb-navy/70 underline-offset-4 transition hover:text-itpb-orange hover:underline"
    >
      ← {label}
    </Link>
  );
}
