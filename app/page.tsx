import Link from "next/link";
import {
  WashingMachine,
  ArrowRight,
  CheckCircle2,
  Calendar,
  CreditCard,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <WashingMachine className="h-7 w-7 text-indigo-600" />
          <span className="text-xl font-bold text-gray-900">Lavanderia do Bairro</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#servicos" className="text-sm text-gray-600 hover:text-gray-900">
            Serviços
          </a>
          <a href="#como-funciona" className="text-sm text-gray-600 hover:text-gray-900">
            Como funciona
          </a>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
          </Link>
          <Link href="/cotacao">
            <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
              Fazer cotação
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]" />
      <div className="mx-auto max-w-6xl px-6 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-indigo-50 px-4 py-1.5 text-sm text-indigo-700">
          <WashingMachine className="h-4 w-4" />
          Serviço de qualidade no seu bairro
        </div>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Lavanderia de qualidade,{" "}
          <span className="text-indigo-600">sem filas e sem espera</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Contrate e acompanhe seu serviço de lavanderia totalmente online. Escolha os itens,
          agende a coleta e receba uma notificação quando estiver pronto para retirar.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/cotacao">
            <Button size="lg" className="px-8 text-base bg-indigo-600 hover:bg-indigo-700">
              Fazer cotação grátis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <a href="#como-funciona">
            <Button variant="outline" size="lg" className="px-8 text-base">
              Como funciona
            </Button>
          </a>
        </div>
      </div>
    </section>
  );
}

function Services() {
  const services = [
    {
      icon: "🛁",
      title: "Toalhas",
      description:
        "Toalhas de banho, rosto e piso lavadas e higienizadas com produtos de qualidade.",
      priceRange: "A partir de R$ 3,00/peça",
    },
    {
      icon: "🛏️",
      title: "Roupa de Cama",
      description:
        "Lençóis, fronhas e edredons lavados e dobrados prontos para uso.",
      priceRange: "A partir de R$ 3,00/peça",
    },
    {
      icon: "👕",
      title: "Roupas",
      description:
        "Camisetas, calças, vestidos e mais. Cuidado especial com cada peça.",
      priceRange: "A partir de R$ 4,50/peça",
    },
  ];

  return (
    <section id="servicos" className="border-t py-24 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Nossos Serviços
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Escolha a categoria e veja os preços por recorrência. Quanto mais frequente, maior o desconto.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {services.map((service) => (
            <div key={service.title} className="rounded-2xl border bg-white p-8 text-center shadow-sm">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-3xl">
                {service.icon}
              </div>
              <h3 className="mt-4 text-xl font-semibold text-gray-900">{service.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{service.description}</p>
              <p className="mt-4 text-sm font-medium text-indigo-600">{service.priceRange}</p>
              <Link href="/cotacao" className="mt-6 block">
                <Button variant="outline" className="w-full">
                  Ver preços completos
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      number: "1",
      icon: WashingMachine,
      title: "Faça sua cotação",
      description: "Selecione a categoria, os itens e veja os preços por recorrência. Totalmente grátis e sem compromisso.",
    },
    {
      number: "2",
      icon: Calendar,
      title: "Agende a entrega",
      description: "Escolha o dia e turno (manhã ou tarde) para levar suas roupas à lavanderia.",
    },
    {
      number: "3",
      icon: CreditCard,
      title: "Confirme e pague",
      description: "Revise os detalhes do pedido e confirme o pagamento com segurança.",
    },
    {
      number: "4",
      icon: Bell,
      title: "Retire quando estiver pronto",
      description: "Você receberá um e-mail assim que o pedido estiver pronto. Venha buscar quando quiser!",
    },
  ];

  return (
    <section id="como-funciona" className="border-t py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-600">
            Simples, rápido e conveniente. Cuide das suas roupas sem sair de casa.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-white text-xl font-bold">
                {step.number}
              </div>
              <h3 className="mt-4 font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Link href="/cotacao">
            <Button size="lg" className="px-10 text-base bg-indigo-600 hover:bg-indigo-700">
              Começar agora
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t bg-gray-50 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <WashingMachine className="h-5 w-5 text-indigo-600" />
            <span className="font-semibold text-gray-900">Lavanderia do Bairro</span>
          </div>
          <div className="flex flex-col items-center gap-1 text-sm text-gray-500 sm:items-end">
            <p>contato@lavanderiadobairro.com.br</p>
            <p>&copy; {new Date().getFullYear()} Lavanderia do Bairro. Todos os direitos reservados.</p>
          </div>
        </div>
        <div className="mt-6 border-t pt-4 text-center">
          <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">
            Acesso funcionários
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <Hero />
      <Services />
      <HowItWorks />
      <Footer />
    </div>
  );
}
