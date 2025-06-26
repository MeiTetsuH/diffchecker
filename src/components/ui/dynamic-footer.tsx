import { Github, Diff } from "lucide-react"
import { Footer } from "@/components/ui/footer"

const MylinxLogo = ({ className }: { className?: string }) => {
  return (
    <img src="./mylinx-logo.png" alt="Mylinx" className={className} />
  )
}

function DynamicFooter() {
  return (
    <div className="w-full">
      <Footer
        logo={<Diff className="h-10 w-10" />}
        brandName="DiffChecker"
        socialLinks={[
          {
            icon: <MylinxLogo className="h-5 w-5" />,
            href: "https://mylinx.cc/asad",
            label: "Mylinx",
          },
          {
            icon: <Github className="h-5 w-5" />,
            href: "https://github.com/asadbek064",
            label: "GitHub",
          },
        ]}
        mainLinks={[
          { href: "/text-compare", label: "Text Compare" },
          { href: "/excel-compare", label: "Spreadsheet Compare" },
          { href: "/json-compare", label: "JSON Compare" },
        ]}
        legalLinks={[
/*           { href: "/privacy", label: "Privacy" },
          { href: "/terms", label: "Terms" }, */
        ]}
        copyright={{
          text: "© 2025 Asadbek Karimov",
          license: "All rights reserved",
        }}
      />
    </div>
  )
}

export { DynamicFooter }