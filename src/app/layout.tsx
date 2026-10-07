import type {Metadata} from "next";
import Header from "@/components/Header";
import Footer from "@/components/layout/Footer";
import "./globals.css";
export const metadata:Metadata={title:{default:"Gluten Free Finder",template:"%s | Gluten Free Finder"},description:"Trova locali, negozi ed esperienze gluten free verificate dalla community."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="it"><body><Header/><div className="site-main">{children}</div><Footer/></body></html>}
