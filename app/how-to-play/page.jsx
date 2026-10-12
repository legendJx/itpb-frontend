import Screen from "@/components/Screen";
import BackButton from "@/components/BackButton";

export const metadata = { title: "How to Play · In The Park Baseball" };

const rules = [
  {
    title: "",
    body: "",
  },
  {
    title: "",
    body: "",
  },
  {
    title: "",
    body: "",
  },
  {
    title: "",
    body: "",
  },
];

export default function HowToPlay() {
  return (
    <Screen title="How to Play">
      <ol className="flex w-full flex-col gap-3 text-left">
        {rules.map((rule, i) => (
          <li
            key={rule.title}
            className="flex gap-4 rounded-2xl border-2 border-itpb-navy/10 bg-white px-5 py-4"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-itpb-grass font-bold text-white">
              {i + 1}
            </span>
            <span>
              <span className="block font-bold">{rule.title}</span>
              <span className="text-sm text-itpb-navy/80">{rule.body}</span>
            </span>
          </li>
        ))}
      </ol>
      <BackButton />
    </Screen>
  );
}
