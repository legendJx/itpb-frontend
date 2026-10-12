import Image from "next/image";
import Screen from "@/components/Screen";
import MenuButton from "@/components/MenuButton";
import background from "@/public/main-menu-bg.jpg";

export default function MainMenu() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#3a1a08]">
      <Image
        src={background}
        alt=""
        fill
        priority
        placeholder="blur"
        sizes="100vw"
        className="object-cover"
      />
      <Screen title="In The Park Baseball" subtitle="Welcome! Pick how you want to play." light>
        <nav className="flex w-full flex-col gap-3">
          <MenuButton
            href="/singleplayer"
            label="Singleplayer"
            description="Take on the computer"
          />
          <MenuButton
            href="/how-to-play"
            label="How to Play"
            description="Learn the rules"
            variant="secondary"
          />
        </nav>
      </Screen>
    </div>
  );
}
