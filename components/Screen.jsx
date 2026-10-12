import Header from "@/components/Header";

// `light` switches to chalk text for screens drawn over a dark background.
export default function Screen({ title, subtitle, light = false, children }) {
  return (
    <main
      className={`relative mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-12 text-center ${
        light ? "text-itpb-chalk" : ""
      }`}
    >
      <Header title={title} />
      {subtitle && (
        <p className={`-mt-3 font-medium ${light ? "text-itpb-chalk/80" : "text-itpb-navy/70"}`}>
          {subtitle}
        </p>
      )}
      {children}
    </main>
  );
}
