import { LoadingState } from '../../../components_shared/feedback/LoadingState'

export function AuthLoadingScreen() {
  return (
    <main>
      <LoadingState label="Verificando seu acesso..." fullPage />
    </main>
  )
}
