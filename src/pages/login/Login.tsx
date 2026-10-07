import { useState } from "react";
import type { FormEvent } from 'react';
import { Navigate, useNavigate } from "react-router";
import { useAuth } from "../../contexts/AuthContext";
import {
  LoginPage,
  BrandSection,
  BrandOverlay,
  BrandContent,
  BrandBadge,
  BrandTitle,
  BrandHighlight,
  BrandDescription,
  BrandFeatures,
  FeatureCard,
  FeatureTitle,
  FeatureText,
  FormSection,
  LoginCard,
  LoginTopBar,
  LoginContent,
  MobileBrand,
  MobileTitle,
  MobileSubtitle,
  LoginHeader,
  LoginTitle,
  LoginSubtitle,
  Form,
  FieldGroup,
  Label,
  Input,
  ErrorMessage,
  SubmitButton,
  LoginFooter,
  LogoStyled,
} from "./LoginStyled";
import { useQueryClient } from "@tanstack/react-query";

export function Login() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  if (!loading && user) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    setError("");
    setFormLoading(true);

    queryClient.clear();

    const { error } = await signIn(email, password);

    if (error) {
      setError("Email ou senha inválidos.");
      setFormLoading(false);
      return;
    }

    queryClient.clear();

    navigate("/", { replace: true });
  }

  return (
    <LoginPage>
      <BrandSection>
        <BrandOverlay />
        <BrandContent>
          <LogoStyled src="/images/logoPng512.png" alt="Logo da retífica" />
          <BrandBadge>GESTÃO AUTOMOTIVA DE ALTO NÍVEL</BrandBadge>

          <BrandTitle>
            Orisson é gay,
            <br />
            nosso depósito de porra
            <br />
            e esperma <BrandHighlight>favorito</BrandHighlight>.
          </BrandTitle>

          <BrandDescription>
            Controle clientes, ordens de serviço e processos internos em um só
            lugar, com uma interface organizada e pronta para o dia a dia.
          </BrandDescription>

          <BrandFeatures>
            <FeatureCard>
              <FeatureTitle>Clientes e ordens centralizados</FeatureTitle>
              <FeatureText>
                Tenha acesso rápido aos cadastros, históricos e dados mais
                importantes da operação.
              </FeatureText>
            </FeatureCard>

            <FeatureCard>
              <FeatureTitle>Fluxo simples para uso diário</FeatureTitle>
              <FeatureText>
                Um sistema pensado para agilizar atendimento, consulta e
                acompanhamento de serviços.
              </FeatureText>
            </FeatureCard>
          </BrandFeatures>
        </BrandContent>
      </BrandSection>

      <FormSection>
        <LoginCard>
          <LoginTopBar />

          <LoginContent>
            <MobileBrand>
              <MobileTitle>Retífica Estação</MobileTitle>
              <MobileSubtitle>
                Faça login para acessar o sistema.
              </MobileSubtitle>
            </MobileBrand>

            <LoginHeader>
              <LoginTitle>Entrar no sistema</LoginTitle>
              <LoginSubtitle>
                Informe seu email e senha para continuar.
              </LoginSubtitle>
            </LoginHeader>

            <Form onSubmit={handleSubmit}>
              <FieldGroup>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Digite seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FieldGroup>

              <FieldGroup>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FieldGroup>

              {error && <ErrorMessage>{error}</ErrorMessage>}

              <SubmitButton type="submit" disabled={formLoading}>
                {formLoading ? "Entrando..." : "Entrar"}
              </SubmitButton>
            </Form>

            <LoginFooter>
              Acesso restrito para usuários autorizados.
            </LoginFooter>
          </LoginContent>
        </LoginCard>
      </FormSection>
    </LoginPage>
  );
}
