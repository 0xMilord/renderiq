import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | Renderiq - AI Architectural Visualization Platform",
  description: "Get in touch with Renderiq. Contact our team for support, sales inquiries, partnerships, or general questions about our AI architectural visualization platform.",
  robots: "index, follow"
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}

