import Header from "@/components/Header";
import StartButton from "@/components/StartButton";


export default function MainMenu() {
  return (
    <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 py-12 text-center">
      <Header title="In The Park Baseball" />
      <StartButton />
    </main>
  );
}
