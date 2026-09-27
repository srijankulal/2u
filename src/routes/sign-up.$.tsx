import { SignUp } from "@clerk/react";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/sign-up/$")({
  component: Page,
});

function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <SignUp routing="hash" fallbackRedirectUrl="/app" signInUrl="/login" />
    </div>
  );
}
