import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

interface InvestorSlideProps {
  title?: string;
  children: ReactNode;
  className?: string;
  variant?: "default" | "title" | "centered";
}

export function InvestorSlide({ 
  title, 
  children, 
  className = "",
  variant = "default" 
}: InvestorSlideProps) {
  if (variant === "title") {
    return (
      <>
        <section className={`w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8${className}`}>
          <div className="text-center">
            {children}
          </div>
        </section>
        <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="border-t border-border"></div>
        </div>
      </>
    );
  }

  if (variant === "centered") {
    return (
      <section className={`w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8${className}`}>
        <div className="max-w-4xl mx-auto">
          <Card className="border-2 shadow-lg">
            {title && (
              <CardHeader className="pb-4">
                <CardTitle className="text-3xl md:text-4xl font-bold">{title}</CardTitle>
              </CardHeader>
            )}
            <CardContent className="space-y-4 text-lg">
              {children}
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section className={`w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8${className}`}>
      <Card className="border-2 shadow-lg">
        {title && (
          <CardHeader className="pb-4">
            <CardTitle className="text-3xl md:text-4xl font-bold">{title}</CardTitle>
          </CardHeader>
        )}
        <CardContent className="space-y-4">
          {children}
        </CardContent>
      </Card>
    </section>
  );
}

