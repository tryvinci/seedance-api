/** Clerk UI tokens aligned with SeedanceAPI paper / ink / accent. */
export const clerkAppearance = {
  variables: {
    colorPrimary: "hsl(213 94% 52%)",
    colorDanger: "hsl(0 72% 51%)",
    colorSuccess: "hsl(142 71% 35%)",
    colorWarning: "hsl(38 92% 40%)",
    colorNeutral: "hsl(220 10% 28%)",
    colorText: "hsl(220 18% 11%)",
    colorTextSecondary: "hsl(220 8% 42%)",
    colorTextOnPrimaryBackground: "#ffffff",
    colorBackground: "#ffffff",
    colorInputBackground: "hsl(40 20% 96%)",
    colorInputText: "hsl(220 18% 11%)",
    borderRadius: "0.75rem",
    fontFamily:
      "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontFamilyButtons:
      "var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, sans-serif",
    fontSize: "0.9375rem",
  },
  elements: {
    rootBox: "w-full",
    cardBox: "w-full shadow-none",
    card: "border border-[hsl(40_10%_88%)] bg-white shadow-none rounded-2xl",
    // Brand copy lives in AuthShell; hide Clerk's default titles.
    header: "hidden",
    headerTitle: "hidden",
    headerSubtitle: "hidden",
    socialButtonsBlockButton:
      "rounded-full border border-[hsl(40_10%_88%)] bg-white text-[hsl(220_18%_11%)] hover:bg-[hsl(40_14%_93%)]",
    socialButtonsBlockButtonText: "font-medium text-sm",
    dividerLine: "bg-[hsl(40_10%_88%)]",
    dividerText:
      "font-mono text-[10px] uppercase tracking-[0.12em] text-[hsl(220_8%_42%)]",
    formFieldLabel: "text-sm font-medium text-[hsl(220_18%_11%)]",
    formFieldInput:
      "rounded-xl border border-[hsl(40_10%_88%)] bg-[hsl(40_20%_96%)] text-[hsl(220_18%_11%)] focus:border-[hsl(213_94%_52%)] focus:ring-[hsl(213_94%_52%)]",
    formButtonPrimary:
      "rounded-full !bg-[#181b20] !text-white text-sm font-medium shadow-none hover:!bg-[#3a3f4a] hover:!text-white",
    formButtonPrimaryText: "!text-white",
    footerActionLink:
      "font-medium text-[hsl(213_94%_52%)] hover:text-[hsl(221_83%_42%)]",
    identityPreviewEditButton:
      "text-[hsl(213_94%_52%)] hover:text-[hsl(221_83%_42%)]",
    formFieldAction:
      "text-[hsl(213_94%_52%)] hover:text-[hsl(221_83%_42%)]",
    otpCodeFieldInput:
      "rounded-xl border border-[hsl(40_10%_88%)] bg-[hsl(40_20%_96%)]",
    alternativeMethodsBlockButton:
      "rounded-full border border-[hsl(40_10%_88%)]",
    formFieldInputShowPasswordButton: "text-[hsl(220_8%_42%)]",
    userButtonPopoverCard:
      "border border-[hsl(40_10%_88%)] shadow-lg rounded-2xl",
    userButtonPopoverActionButton:
      "text-[hsl(220_18%_11%)] hover:bg-[hsl(40_14%_93%)]",
    // Brand mark is rendered above the form in AuthShell.
    logoBox: "hidden",
    logoImage: "hidden",
  },
  layout: {
    socialButtonsPlacement: "top" as const,
    socialButtonsVariant: "blockButton" as const,
    showOptionalFields: true,
  },
};
