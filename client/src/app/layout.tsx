import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/Header";

export const metadata: Metadata = {
    title: "THEOROGRAM - Ideas Over People",
    description: "A platform for structured theory publishing and intellectual debate. Reason over reaction.",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body>
                <AuthProvider>
                    <div className="min-h-screen flex flex-col">
                        {/* Client-side header with auth state */}
                        <Header />

                        {/* Main content */}
                        <main className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
                            {children}
                        </main>

                        {/* Footer - minimal */}
                        <footer className="border-t border-border py-6">
                            <div className="max-w-6xl mx-auto px-4 text-center text-sm text-text-tertiary">
                                <p>Ideas over people. Reason over reaction. Signal over noise.</p>
                            </div>
                        </footer>
                    </div>
                </AuthProvider>
            </body>
        </html>
    );
}
