import { Inter, Roboto } from "next/font/google";
import "./globals.css";
import { AppProvider } from "@/context/AppContext";
import { SmoothScrollProvider } from "@/context/SmoothScrollContext";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-roboto",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
export const metadata = {
  title: "MRA | Indian Restaurant & Bakery",
  description:
    "MRA Bakery & Restaurant. Authentic Indian dum biryanis, legendary live charcoal grills, flaky Malabar parottas, and artisanal celebration cakes.",
  keywords: [
    "MRA",
    "MRA Bakery",
    "MRA Restaurant",
    "Indian restaurant",
    "Malabar restaurant",
    "Dum Biryani",
    "Kerala Parotta",
    "Bakery",
    "Cakes",
    "Grills",
  ],
  authors: [{ name: "MRA Culinary Group" }],
  creator: "MRA",
  metadataBase: new URL("https://mra-bakery.com"),
  openGraph: {
    title: "MRA | Indian Restaurant & Bakery",
    description:
      "Crafted by tradition. Authentic Indian dum biryanis, charcoal grills, stone bakery, and handcrafted cakes.",
    url: "https://mra-bakery.com",
    siteName: "MRA",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/logo/mra-red-white.webp",
        width: 1600,
        height: 1014,
        alt: "MRA Bakery & Restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MRA | Indian Restaurant & Bakery",
    description:
      "Authentic Indian dum biryanis, charcoal grills, stone bakery, and handcrafted cakes.",
    images: ["/logo/mra-red-white.webp"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const restaurantSchema = {
  "@context": "https://schema.org",
  "@type": "Bakery",
  name: "MRA Bakery & Restaurant",
  image: "https://mra-bakery.com/logo/mra-red-white.webp",
  description:
    "Premier Indian restaurant and artisanal bakery serving authentic Malabar biryanis, wood-fired grills, stone bakery, and handcrafted cakes.",
  servesCuisine: ["Indian", "Malabar", "Bakery", "Barbecue", "Cakes"],
  priceRange: "$$",
  telephone: "+91-95672-00001",
  address: {
    "@type": "PostalAddress",
    streetAddress: "Mavoor Road, Near SM Street",
    addressLocality: "Kozhikode",
    addressRegion: "Kerala",
    postalCode: "673001",
    addressCountry: "IN",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 11.2588,
    longitude: 75.7804,
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      opens: "08:00",
      closes: "23:00",
    },
  ],
  menu: "https://mra-bakery.com/#menu",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${roboto.variable} ${inter.variable} h-full bg-black antialiased`}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- App Router root layout loads this font globally. */}
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Bebas+Neue&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-black text-[#f5ecd9] font-sans selection:bg-[#ef4444] selection:text-black">
        <AppProvider>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </AppProvider>
      </body>
    </html>
  );
}
