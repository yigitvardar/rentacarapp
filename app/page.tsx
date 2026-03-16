import Link from "next/link";
import { Car, Shield, CreditCard, CheckCircle } from "lucide-react";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-brand-950 via-brand-900 to-brand-800">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Car className="h-8 w-8 text-white" />
          <span className="text-white text-2xl font-bold">
            {process.env.NEXT_PUBLIC_APP_NAME || "Araç Kiralama"}
          </span>
        </div>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
          >
            Giriş Yap
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 bg-white text-brand-900 font-semibold rounded-lg hover:bg-brand-50 transition-colors"
          >
            Üye Ol
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="animate-fade-in">
          <span className="inline-block px-4 py-1.5 bg-white/10 text-white/90 text-sm rounded-full mb-6 border border-white/20">
            Sigorta Poliçenize Özel Fırsatlar
          </span>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Araç Kiralamanın
            <br />
            <span className="text-brand-300">En Akıllı Yolu</span>
          </h1>
          <p className="text-xl text-white/70 max-w-2xl mx-auto mb-10">
            TC kimlik numaranızı girin, sigorta poliçenize özel araç kiralama
            paketlerini keşfedin. Güvenli, hızlı ve tamamen size özel.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="px-8 py-4 bg-white text-brand-900 font-bold text-lg rounded-xl hover:bg-brand-50 transition-all hover:scale-105 shadow-xl"
            >
              Hemen Başla
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 border-2 border-white/40 text-white font-semibold text-lg rounded-xl hover:bg-white/10 transition-all"
            >
              Giriş Yap
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl p-6 text-white hover:bg-white/15 transition-colors"
            >
              <div className="w-12 h-12 bg-brand-500/30 rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-brand-300" />
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-white/70">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Steps */}
      <section className="container mx-auto px-4 py-16 pb-24">
        <h2 className="text-3xl font-bold text-white text-center mb-12">
          Nasıl Çalışır?
        </h2>
        <div className="grid md:grid-cols-4 gap-4">
          {steps.map((step, i) => (
            <div key={step.title} className="text-center text-white">
              <div className="w-12 h-12 bg-brand-500 rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                {i + 1}
              </div>
              <h4 className="font-semibold mb-1">{step.title}</h4>
              <p className="text-sm text-white/60">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-6">
        <p className="text-center text-white/40 text-sm">
          © 2026 Araç Kiralama. Tüm hakları saklıdır.
        </p>
      </footer>
    </main>
  );
}

const features = [
  {
    icon: Shield,
    title: "Sigorta Entegrasyonu",
    description:
      "TC kimliğinizle poliçenizi sorgulayın, size özel paketleri anında görün.",
  },
  {
    icon: Car,
    title: "Geniş Araç Filosu",
    description:
      "Ekonomikten lükse, geniş araç yelpazemizden ihtiyacınıza uygun aracı seçin.",
  },
  {
    icon: CreditCard,
    title: "Güvenli Ödeme",
    description:
      "Iyzico altyapısı ile 3D Secure güvencesinde anlık ödeme yapın.",
  },
];

const steps = [
  {
    title: "Kayıt Ol",
    description: "E-posta ve şifrenizle hesap oluşturun.",
  },
  {
    title: "TC Giris",
    description: "TC kimlik numaranızı sisteme girin.",
  },
  {
    title: "Paket Seç",
    description: "Poliçenize özel paketleri inceleyin.",
  },
  {
    title: "Kiralayın",
    description: "Ödeme yapın, aracınızı teslim alın.",
  },
];
