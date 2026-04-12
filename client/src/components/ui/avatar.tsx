import React from "react";

export default function Avatar({ src, alt }: { src?: string; alt?: string }) {
  return (
    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden border border-border">
      {src ? (
        <img
          src={src}
          alt={alt || "Profile"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-xl text-muted-foreground">👤</span>
      )}
    </div>
  );
}
