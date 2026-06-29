import { Spinner } from "./Spinner";
import { LoadingWrapper, LoadingText } from "./LoadingWrapper";

type LoadingContainerProps = {
  text?: string;
};

export function LoadingContainer({
  text = "Carregando...",
}: LoadingContainerProps) {
  return (
    <LoadingWrapper aria-busy="true">
      <Spinner size="lg" />
      <LoadingText>{text}</LoadingText>
    </LoadingWrapper>
  );
}