import "./globals.css";

export const metadata={
  metadataBase:new URL("https://matchpattern.com"),
  title:"MatchPattern | Football Prediction & Match Analysis",
  description:"Independent football match analysis and pattern-based predictions.",
  keywords:["football predictions","match analysis","football stats","MatchPattern"],
  openGraph:{title:"MatchPattern | Football Prediction & Match Analysis",description:"Independent football match analysis and pattern-based predictions.",type:"website",siteName:"MatchPattern"},
  robots:{index:true,follow:true}
};

export default function RootLayout({children}){return <html lang="en"><body>{children}</body></html>}
