"use client";

import { useState } from "react";
import ViralClipFinder from "@/components/viral-clip-finder";

export default function ViralClipPage() {
  return (
    <div className="min-h-screen bg-background">
      <ViralClipFinder />
    </div>
  );
}