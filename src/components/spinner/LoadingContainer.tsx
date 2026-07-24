import { Spinner } from "./Spinner";
import { LoadingWrapper, LoadingText } from "./LoadingWrapper";

type LoadingContainerProps = {
  text?: string;
  fullScreen?: boolean;
};

export function LoadingContainer({
  text = "Carregando...",
  fullScreen = false,
}: LoadingContainerProps) {
  return (
    <LoadingWrapper $fullScreen={fullScreen} aria-busy="true">
      <Spinner size="lg" />
      <LoadingText>{text}</LoadingText>
    </LoadingWrapper>
  );
}
