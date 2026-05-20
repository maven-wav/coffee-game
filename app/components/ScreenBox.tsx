import type { ReactNode } from "react";

type ScreenBoxProps = {
  variant: "light" | "dark";
  children: ReactNode;
  className?: string;
};

export default function ScreenBox({
  variant,
  children,
  className = "",
}: ScreenBoxProps) {
  return (
    <div
      className={`mx-[10px] flex flex-1 flex-col rounded-[18px] px-[14px] py-[18px] ${
        variant === "light" ? "bg-white" : "bg-[#1A1A2E]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
