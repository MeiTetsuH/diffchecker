import { HeroSection } from "@/components/ui/dynamic-hero";
import { BaseLayout } from "@/layout/base-layout";

export default function Home() {
  return (
    <div>
    <BaseLayout>
        <HeroSection
          heading="Compare Text, Spreadsheets, JSON etc."
          tagline="A Simple Way to Diff"
          buttonText="Let's diff it"
          buttonHref="/text-compare"
          imageUrl="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg"
          videoUrl="https://github.com/ShatteredDisk/rickroll/raw/refs/heads/master/rickroll.mp4"
        />
      </BaseLayout>
    </div>
  );
}
