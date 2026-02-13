"use client";

import React from "react";

export function PrivateRoute({ children }: { children: React.ReactNode }) {
    // TODO: Implement authentication check
    return <>{children}</>;
}

export function PublicRoute({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
