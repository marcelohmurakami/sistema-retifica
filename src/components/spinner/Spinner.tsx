import { SpinnerStyled } from "./SpinnerStyled";

type SpinnerProps = {
  size?: "sm" | "md" | "lg";
};

export function Spinner({ size = "md" }: SpinnerProps) {
  return (
    <SpinnerStyled
      $size={size}
      role="progressbar"
      aria-label="Carregando"
    />
  );
}