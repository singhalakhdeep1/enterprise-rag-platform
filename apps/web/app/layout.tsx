import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Enterprise RAG Knowledge Platform",
    description: "Semantic enterprise knowledge retrieval with ingestion, search, and observability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <html lang="en">
            <body>{children}</body>
        </html>
    );
}
