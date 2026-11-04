import "./globals.css";

export const metadata = {
  title: "SIGWEB | Monitoramento Hidrológico — Bacia do Mindu (Manaus/AM)",
  description:
    "Sistema de Informações Geográficas e Monitoramento Hidrológico em Tempo Real da Sub-Bacia do Igarapé do Mindu — Manaus/AM.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className="h-full antialiased font-sans"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
