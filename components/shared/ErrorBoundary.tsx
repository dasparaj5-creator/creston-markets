"use client";

import React from "react";
import { logger } from "@/lib/logger";
import { AlertTriangle } from "lucide-react";

interface Props {
  children: React.ReactNode;
  fallbackLabel?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    logger.error("React Error Boundary caught an error", {
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[300px] w-full flex-col items-center justify-center gap-3 rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
          <AlertTriangle className="h-8 w-8 text-danger" />
          <p className="font-semibold text-text-primary">
            {this.props.fallbackLabel || "Something went wrong loading this section."}
          </p>
          <p className="text-sm text-text-muted">
            The issue has been logged. Please refresh the page or contact support if it persists.
          </p>
          <button
            className="btn-secondary mt-2"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
