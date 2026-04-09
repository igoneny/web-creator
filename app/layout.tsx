import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Webcraft AI — Tu web profesional en 5 minutos",
  description:
    "Crea tu sitio web con inteligencia artificial. Elige una plantilla, describe tu negocio y tendrás tu web online en menos de 5 minutos.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
