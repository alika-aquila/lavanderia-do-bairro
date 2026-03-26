import Link from "next/link";
import { CATALOGO } from "@/lib/catalogo";
import {
  ArrowRight,
  Calendar,
  CreditCard,
  Bell,
  Instagram,
} from "lucide-react";
import { DuckIcon } from "@/components/ui/duck-icon";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/lavanderia/user-menu";

function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <DuckIcon className="h-6 w-6 text-gray-900" />
          <span className="text-xl font-bold text-gray-900">Lavô</span>
        </Link>
        <UserMenu />
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden py-24 sm:py-32">
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.2,
          zIndex: 0,
        }}
      >
        <source src="/videos/hero-background.mp4" type="video/mp4" />
      </video>
      <div
        className="absolute inset-0 bg-[radial-gradient(45%_40%_at_50%_60%,rgba(99,102,241,0.08),transparent)]"
        style={{ zIndex: 1, opacity: 0 }}
      />
      <div className="mx-auto max-w-6xl px-6 text-center" style={{ position: "relative", zIndex: 2 }}>
        <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
          Cuidamos das{" "}
          <span className="text-indigo-600">suas roupas</span>
          {" "}com carinho
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-gray-600">
          Um serviço simples, organizado e pensado para facilitar o seu dia
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
  const servicesMeta = [
    {
      slug: "toalhas",
      imageBg: "from-sky-50 to-blue-100",
      imageEmoji: "🛁",
      description: "Toalhas de banho, rosto e piso lavadas e higienizadas com produtos de qualidade.",
    },
    {
      slug: "roupa-de-cama",
      imageBg: "from-amber-50 to-orange-100",
      imageEmoji: "🛏️",
      description: "Lençóis, fronhas e edredons lavados e dobrados prontos para uso.",
    },
    {
      slug: "roupas",
      imageBg: "from-violet-50 to-indigo-100",
      imageEmoji: "👕",
      description: "Camisetas, calças, vestidos e mais. Cuidado especial com cada peça.",
    },
  ];

  const services = servicesMeta.map((s) => {
    const cat = CATALOGO.find((c) => c.slug === s.slug)!;
    const minPrice = Math.min(...cat.itens.flatMap((i) => Object.values(i.precos)));
    return {
      ...s,
      title: cat.nome,
      priceRange: `A partir de R$ ${minPrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/peça`,
    };
  });

  return (
    <section id="servicos" className="border-t py-24 bg-gray-50">
      <div className="mx-auto max-w-6xl px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Nossos Serviços
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
            Escolha a categoria e veja os preços por recorrência.
          </p>
          <p className="mx-auto mt-1 max-w-2xl text-lg text-gray-600">
            Quanto mais frequente, maior o desconto.
          </p>
        </div>
        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {services.map((service) => (
            <div key={service.slug} className="flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
              {/* Imagem representativa — substituir por <Image src="..." /> quando disponível */}
              <div className={`flex h-52 w-full items-center justify-center bg-gradient-to-br ${service.imageBg}`}>
                <span className="text-8xl">{service.imageEmoji}</span>
              </div>
              <div className="flex flex-1 flex-col p-8 text-center">
                <h3 className="text-xl font-semibold text-gray-900">{service.title}</h3>
                <p className="mt-2 text-sm leading-6 text-gray-600">{service.description}</p>
                <p className="mt-4 text-sm font-medium text-indigo-600">{service.priceRange}</p>
                <Link href={`/cotacao?categoria=${service.slug}&step=2`} className="mt-6 block">
                  <Button variant="outline" className="w-full">
                    Ver preços completos
                  </Button>
                </Link>
              </div>
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
      icon: DuckIcon,
      title: "Faça sua cotação",
      description: "Selecione a categoria, os itens e veja os preços por recorrência.",
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
            Simples, rápido e conveniente.
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
        <div className="mt-20 text-center">
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
    <footer className="border-t bg-gray-50 py-10">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <DuckIcon className="h-5 w-5 text-gray-900" />
              <span className="font-semibold text-gray-900">Lavô</span>
            </div>
            <Link href="/admin/login" className="text-xs text-gray-400 hover:text-gray-600">
              Acesso funcionários
            </Link>
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <p>&copy; {new Date().getFullYear()} Lavô</p>
            <a
              href="https://www.instagram.com/likka.blu/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-400 hover:text-gray-600"
              aria-label="Instagram"
            >
              <Instagram className="h-4 w-4" />
            </a>
          </div>
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
