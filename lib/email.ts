import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM || "Lavanderia <onboarding@resend.dev>";

export async function enviarEmailPronto({
  clienteEmail,
  clienteNome,
  pedidoId,
}: {
  clienteEmail: string;
  clienteNome: string;
  pedidoId: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: clienteEmail,
    subject: "Seu pedido está pronto para retirada!",
    html: `
      <p>Olá, ${clienteNome}!</p>
      <p>Boas notícias! Seu pedido <strong>#${pedidoId.slice(-6).toUpperCase()}</strong> está pronto e aguardando retirada na lavanderia.</p>
      <p>Pode vir buscar quando quiser!</p>
      <p>Qualquer dúvida, estamos à disposição.</p>
      <p>— Equipe Lavanderia do Bairro</p>
    `,
  });
}

export async function enviarEmailDivergencia({
  clienteEmail,
  clienteNome,
  pedidoId,
  mensagem,
}: {
  clienteEmail: string;
  clienteNome: string;
  pedidoId: string;
  mensagem: string;
}) {
  await resend.emails.send({
    from: FROM,
    to: clienteEmail,
    subject: "Informação sobre seu pedido na lavanderia",
    html: `
      <p>Olá, ${clienteNome}!</p>
      <p>Gostaríamos de informar uma divergência identificada no seu pedido <strong>#${pedidoId.slice(-6).toUpperCase()}</strong>:</p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 16px; color: #555;">
        ${mensagem}
      </blockquote>
      <p>Entre em contato conosco para resolvermos juntos.</p>
      <p>— Equipe Lavanderia do Bairro</p>
    `,
  });
}
