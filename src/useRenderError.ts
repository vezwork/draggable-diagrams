import { useState } from "react";

export function useRenderError() {
  const [error, setError] = useState<unknown>(null);

  if (error) {
    throw error;
  }

  return (err: unknown) => {
    setError(err);
  };
}
