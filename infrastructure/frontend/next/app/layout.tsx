import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "@/app/globals.css";

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "MyGES 2.0",
    description: "Plateforme de gestion scolaire",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="fr" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                {children}
                <Script
                    src="https://analytics.newges.fr/script.js"
                    data-website-id="2571b09c-f190-4bed-8e46-22c6d3d6c3f6"
                    strategy="afterInteractive"
                />
            </body>
        </html>
    );
}
