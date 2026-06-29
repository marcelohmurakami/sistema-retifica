import { useEffect, useState } from "react";
import {
  FaUser,
  FaLock,
  FaPalette,
  FaSave,
  FaCamera,
} from "react-icons/fa";

import {
  PageContainer,
  Header,
  PageTitle,
  SectionCard,
  SectionHeader,
  SectionTitle,
  FormGroup,
  Label,
  Input,
  Button,
  AvatarWrapper,
  AvatarImage,
  AvatarUpload,
  Grid,
  AvatarUploadLabel,
  ThemeOption,
  ThemeToggle,
} from "./ConfigsStyled.tsx";
import { useGetCurrentUser, useUpdateProfile, useUploadAvatar } from "./useConfiguracoes.ts";
import { supabase } from "../../services/supabaseApi.ts";
import { useThemeMode } from "../../contexts/ThemeModeContext.tsx";

export function Configuracoes() {
  const { data: user } = useGetCurrentUser();
  const { themeMode, setThemeMode } = useThemeMode();

  const { mutate: saveProfile } = useUpdateProfile();
  const { mutate: uploadAvatar } = useUploadAvatar();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    setName(user.user_metadata?.name || "");
    setEmail(user.email || "");
    setAvatarUrl(user.user_metadata.avatar_url || "");
  }, [user]);

  function handleSaveProfile () {
    saveProfile({ name, email, avatarUrl });
  }

  async function handleUpdatePassword() {
    try {
      setIsLoading(true);

      if (!oldPassword || !newPassword || !confirmPassword) {
        alert("Preencha todos os campos.");
        return;
      }

      if (newPassword !== confirmPassword) {
        alert("As senhas novas não são iguais.");
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user?.email) {
        alert("Usuário não encontrado.");
        return;
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: oldPassword,
      });

      if (signInError) {
        alert("Senha atual incorreta.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        alert("Erro ao atualizar senha.");
        return;
      }

      alert("Senha atualizada com sucesso!");

      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setIsLoading(false);
    }
  }

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file) return;

    uploadAvatar(file, {
      onSuccess: (publicUrl) => {
        setAvatarUrl(publicUrl);

        saveProfile({
          name,
          email,
          avatarUrl: publicUrl,
        });
      },
    });
  }

  return (
    <PageContainer>
      <Header>
        <PageTitle>Configurações</PageTitle>
      </Header>

      <Grid>
        {/* PERFIL */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaUser />
              Perfil
            </SectionTitle>
          </SectionHeader>

          <AvatarWrapper>
            <AvatarImage src={avatarUrl || "https://i.pravatar.cc/150"} />

            <AvatarUpload
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
            />

            <AvatarUploadLabel htmlFor="avatar-upload">
              <FaCamera />
              Alterar foto
            </AvatarUploadLabel>
          </AvatarWrapper>

          <FormGroup>
            <Label>Nome</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormGroup>

          <Button onClick={handleSaveProfile}>
            <FaSave />
            Salvar alterações
          </Button>
        </SectionCard>

        {/* SEGURANÇA */}
        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaLock />
              Segurança
            </SectionTitle>
          </SectionHeader>

          <FormGroup>
            <Label>Senha atual</Label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Nova senha</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </FormGroup>

          <FormGroup>
            <Label>Confirmar nova senha</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </FormGroup>

          <Button onClick={handleUpdatePassword} disabled={isLoading}>
            <FaLock />
            Alterar senha
          </Button>
        </SectionCard>

        <SectionCard>
          <SectionHeader>
            <SectionTitle>
              <FaPalette />
              Aparência
            </SectionTitle>
          </SectionHeader>

          <ThemeToggle>
            <ThemeOption
              type="button"
              $active={themeMode === "light"}
              onClick={() => setThemeMode("light")}
            >
              Claro
            </ThemeOption>
            <ThemeOption
              type="button"
              $active={themeMode === "dark"}
              onClick={() => setThemeMode("dark")}
            >
              Escuro
            </ThemeOption>
          </ThemeToggle>
        </SectionCard>
      </Grid>
    </PageContainer>
  );
}
