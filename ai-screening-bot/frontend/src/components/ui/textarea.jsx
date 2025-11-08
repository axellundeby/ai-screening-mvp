import React from "react";

const Textarea = React.forwardRef(({ className = "", ...props }, ref) => {
  return (
    <textarea
  className={`block box-border max-w-full min-h-[80px] rounded-md border border-input border-l-0 border-r-0 bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 bg-white placeholder:text-gray-500 focus-visible:ring-blue-500 resize-y ${className}`}
  ref={ref}
  {...props}
/>

  );
});
Textarea.displayName = "Textarea";

export { Textarea };
