import Navbar from "../components/Landing/Navbar";
import HeroSection from "../components/Landing/HeroSection";
import JobSection from "../components/Landing/JobSection";
import AboutUs from "../components/Landing/AboutUs";
import Footer from "../components/Landing/Footer";

export default function LandingPage() {
  return (
    <div>
      <Navbar />
      <HeroSection />
      <JobSection />
      <AboutUs />
      <Footer />
    </div>
  );
}
