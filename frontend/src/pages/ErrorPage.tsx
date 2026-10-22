import React from "react";
import {
  NotFoundPage,
  ServerErrorPage,
  ForbiddenPage,
  BadRequestPage,
} from "./error";

export interface ErrorPageProps {
  code?: 400 | 403 | 404 | 500 | 410 | number;
  title?: string;
  description?: string;
  weddingSlug?: string;
  error?: Error | unknown;
  onRetry?: () => void;
  onNavigateHome?: () => void;
}

export const ErrorPage: React.FC<ErrorPageProps> = ({
  code = 404,
  title,
  description,
  weddingSlug,
  error,
  onRetry,
  onNavigateHome,
}) => {
  if (code === 500) {
    return (
      <ServerErrorPage
        title={title}
        description={description}
        error={error}
        onRetry={onRetry}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (code === 403) {
    return (
      <ForbiddenPage
        title={title}
        description={description}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  if (code === 400) {
    return (
      <BadRequestPage
        title={title}
        description={description}
        onNavigateHome={onNavigateHome}
      />
    );
  }

  // Default to 404 Not Found
  return (
    <NotFoundPage
      title={title}
      description={description}
      weddingSlug={weddingSlug}
      onNavigateHome={onNavigateHome}
    />
  );
};
