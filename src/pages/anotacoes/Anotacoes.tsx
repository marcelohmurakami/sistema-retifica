import { useState } from "react";
import { MainContent } from "../../components/mainContent/MainContent";
import { AnotacoesDiarias } from "./AnotacoesDiarias";
import { AnotacoesGerais } from "./AnotacoesGerais";
import { PageHeader, Subtitle, TabButton, Tabs, Title } from "./AnotacoesStyled";

export function Anotacoes () {
    const [activeTab, setActiveTab] = useState<"diarias" | "gerais">("diarias");

  return (
    <MainContent>
      <PageHeader>
        <div>
          <Title>Anotações</Title>
          <Subtitle>Lembretes, tarefas e observações da oficina</Subtitle>
        </div>
      </PageHeader>

      <Tabs>
        <TabButton
          $active={activeTab === "diarias"}
          onClick={() => setActiveTab("diarias")}
        >
          Diárias
        </TabButton>

        <TabButton
          $active={activeTab === "gerais"}
          onClick={() => setActiveTab("gerais")}
        >
          Gerais
        </TabButton>
      </Tabs>

      {activeTab === "diarias" && <AnotacoesDiarias />}
      {activeTab === "gerais" && <AnotacoesGerais />}
    </MainContent>
  );
}