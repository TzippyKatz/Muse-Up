"use client";

import { Suspense } from "react";
import ResetPasswordComponent from "./ResetPasswordComponent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordComponent />
    </Suspense>
  );
}
