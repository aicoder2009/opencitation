import { SignUp } from "@clerk/nextjs";
import { WikiLayout } from "@/components/wiki";

const wikiAppearance = {
  variables: {
    colorPrimary: "var(--color-wiki-link)",
    colorBackground: "var(--color-wiki-white)",
    colorInputBackground: "var(--color-wiki-white)",
    colorText: "var(--color-wiki-text)",
    colorTextSecondary: "var(--color-wiki-text-muted)",
    colorInputText: "var(--color-wiki-text)",
    colorDanger: "var(--color-wiki-link-active)",
    borderRadius: "0px",
    fontFamily: "Arial, Helvetica, sans-serif",
    fontSize: "14px",
  },
  elements: {
    rootBox: { width: "100%" },
    card: {
      boxShadow: "none",
      border: "1px solid var(--color-wiki-border)",
      backgroundColor: "var(--color-wiki-white)",
      width: "100%",
    },
    headerTitle: { fontWeight: "bold", fontSize: "16px" },
    formButtonPrimary: {
      backgroundColor: "var(--color-wiki-offwhite)",
      color: "var(--color-wiki-link)",
      border: "1px solid var(--color-wiki-border-light)",
      borderRadius: "0px",
      boxShadow: "none",
      fontWeight: "normal",
      textTransform: "none" as const,
    },
    formFieldInput: {
      borderRadius: "0px",
      boxShadow: "none",
      border: "1px solid var(--color-wiki-border-light)",
      backgroundColor: "var(--color-wiki-white)",
    },
    socialButtonsBlockButton: {
      borderRadius: "0px",
      boxShadow: "none",
      border: "1px solid var(--color-wiki-border-light)",
      backgroundColor: "var(--color-wiki-white)",
    },
    socialButtonsBlockButtonText: { fontWeight: "normal" },
    dividerLine: { backgroundColor: "var(--color-wiki-border-light)" },
    dividerText: { color: "var(--color-wiki-text-muted)" },
    footerActionLink: { color: "var(--color-wiki-link)" },
    identityPreviewEditButton: { color: "var(--color-wiki-link)" },
  },
};

export default function SignUpPage() {
  return (
    <WikiLayout>
      <div className="max-w-md mx-auto py-4">
        <h2 className="text-lg font-bold text-wiki-text pb-1 mb-5 border-b border-wiki-border">
          Create an account
        </h2>
        <SignUp appearance={wikiAppearance} />
      </div>
    </WikiLayout>
  );
}
