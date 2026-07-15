import { Castle, Mountain, School, Sparkles, TreePine } from "lucide-react";
import type { ClassroomScene as Scene, ClassroomTheme } from "@/types/dashboard";

const themeStyles: Record<ClassroomTheme, { sky: string; island: string; ground: string; icon: string }> = {
  violet: { sky: "from-[#a9e8fb] via-[#d4f7ff] to-[#eefcff]", island: "bg-[#66c68a]", ground: "bg-[#42aa75]", icon: "text-[#a66e3a] bg-[#ffdf9e]" },
  emerald: { sky: "from-[#a6ebdf] via-[#d8f7ed] to-[#effcf7]", island: "bg-[#75cf76]", ground: "bg-[#3da96e]", icon: "text-[#b05f35] bg-[#f5bc65]" },
  orange: { sky: "from-[#b7e6ff] via-[#e5f7ff] to-[#fff8e8]", island: "bg-[#72ca7b]", ground: "bg-[#45a66d]", icon: "text-[#92569c] bg-[#ffcf91]" },
};

const sceneIcons = { school: School, mountain: Mountain, castle: Castle };

export function ClassroomScene({ scene, theme }: { scene: Scene; theme: ClassroomTheme }) {
  const styles = themeStyles[theme];
  const MainIcon = sceneIcons[scene];

  return (
    <div className={`relative h-36 overflow-hidden bg-gradient-to-b ${styles.sky}`} aria-hidden="true">
      <span className="absolute left-5 top-5 h-4 w-14 rounded-full bg-white/65 blur-[1px]" />
      <span className="absolute right-7 top-8 h-5 w-20 rounded-full bg-white/55 blur-[1px]" />
      <Sparkles className="absolute right-5 top-4 size-5 text-amber-300" />
      <div className={`absolute -bottom-9 left-1/2 h-28 w-[82%] -translate-x-1/2 rounded-[50%] ${styles.ground} shadow-[0_16px_25px_rgba(32,103,92,0.24)]`} />
      <div className={`absolute -bottom-1 left-1/2 h-20 w-[72%] -translate-x-1/2 rounded-[50%] ${styles.island}`} />
      <TreePine className="absolute bottom-6 left-[14%] size-12 fill-[#42aa62] text-[#278158]" />
      <TreePine className="absolute bottom-4 right-[13%] size-14 fill-[#45b465] text-[#2d8355]" />
      <span className={`absolute bottom-6 left-1/2 grid size-[72px] -translate-x-1/2 place-items-center rounded-[24px] shadow-[0_12px_22px_rgba(35,69,92,0.18)] ring-4 ring-white/60 ${styles.icon}`}>
        <MainIcon className="size-11" strokeWidth={1.7} />
      </span>
      <span className="absolute bottom-8 left-[33%] size-2 rounded-full bg-pink-300" />
      <span className="absolute bottom-14 right-[31%] size-2 rounded-full bg-amber-300" />
    </div>
  );
}
