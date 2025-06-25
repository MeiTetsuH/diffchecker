import { HeroSection } from "@/components/ui/dynamic-hero";

const LandingPage = () => {
    const myImage = (
     <img 
       src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bGFuZHNjYXBlfGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60" 
       alt="Beautiful Landscape"
       className="w-full h-full object-cover"
     />
   );
 
   const myVideo = (
     <video 
       src="https://www.w3schools.com/html/mov_bbb.mp4" // Replace with your video URL
       autoPlay 
       loop 
       muted 
       playsInline
       className="w-full h-full object-cover"
     >
       Your browser does not support the video tag.
     </video>
   );
 
   return (
     <div>
       <HeroSection
         heading="Compare Text, Spreadsheets, JSON etc."
         tagline="A Simple Way to Diff"
         buttonText="Let's diff it"
         imageUrl="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-HD.jpg"
         videoUrl="https://cdn-lfs.hf.co/repos/44/4e/444ea7f5429c5df3657d793704612afd69db5f63f57dcf14065937185e9ccbdc/01036863089ca6a3f6f3bb458423acdcc3ab7eead6e67d3efd5f169733354ec9?response-content-disposition=inline%3B+filename*%3DUTF-8%27%27View_From_A_Blue_Moon_Trailer-1080p.mp4%3B+filename%3D%22View_From_A_Blue_Moon_Trailer-1080p.mp4%22%3B&response-content-type=video%2Fmp4&Expires=1750817519&Policy=eyJTdGF0ZW1lbnQiOlt7IkNvbmRpdGlvbiI6eyJEYXRlTGVzc1RoYW4iOnsiQVdTOkVwb2NoVGltZSI6MTc1MDgxNzUxOX19LCJSZXNvdXJjZSI6Imh0dHBzOi8vY2RuLWxmcy5oZi5jby9yZXBvcy80NC80ZS80NDRlYTdmNTQyOWM1ZGYzNjU3ZDc5MzcwNDYxMmFmZDY5ZGI1ZjYzZjU3ZGNmMTQwNjU5MzcxODVlOWNjYmRjLzAxMDM2ODYzMDg5Y2E2YTNmNmYzYmI0NTg0MjNhY2RjYzNhYjdlZWFkNmU2N2QzZWZkNWYxNjk3MzMzNTRlYzk%7EcmVzcG9uc2UtY29udGVudC1kaXNwb3NpdGlvbj0qJnJlc3BvbnNlLWNvbnRlbnQtdHlwZT0qIn1dfQ__&Signature=tnSXDx6OfM4VNXB6KixSYgjOo94IkIyPVyRnFIXs2Jd7p15aLSVOs%7EG23dq0QFKlJBRUIpauRl4hmPEhePFuprK7XO0hYj1nA0OxglIKLnwJBZQtwvI-cyo6a8YhIOheEjFt8xo1IgZx9ghp3oQQ2ep5I7L-4iEmt1i-csIU2jxC6CHMJUb1S2Nl5N8otrORMrVLm4Mneja6GfUBhz-8SbYS7avg1gjEgqCc715rnb9%7EkYYgPocPKOs-hKhIejixr6tio55c4wicfyp0vQGNyvyHZl4NafiYDfI7sMR3gNvcYoH-gocGWjqSLWQEiO5B4GL1VdOT2Hq%7EHSgEw5YrBg__&Key-Pair-Id=K3RPWS32NSSJCE"
       />
     </div>
   );
 };
 
 export { LandingPage };