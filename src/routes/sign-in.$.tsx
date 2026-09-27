import { SignIn } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-in/$")({
  component: Page,
});

function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignIn routing="hash" fallbackRedirectUrl="/app" signUpUrl="/register" />
    </div>
  );
}
