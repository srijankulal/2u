import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createStart, createCsrfMiddleware } from "@tanstack/react-start";

export const startInstance = createStart(() => {
  return {
    requestMiddleware: [clerkMiddleware(), createCsrfMiddleware()],
  };
});
