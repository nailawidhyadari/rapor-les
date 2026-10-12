import Provider from "@/components/Provider";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <Provider>{children}</Provider>;
}
