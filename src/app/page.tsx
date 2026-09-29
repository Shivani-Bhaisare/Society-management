import Navbar from '../Components/Navbar'
import Hero from '../Components/Hero'
import Features from '../Components/Features'
import Problem from '../Components/Problem'
import Platform from '../Components/Platform'
import Security from '../Components/Security'
import Billing from '../Components/Billing'
import Finance from '../Components/Finance'
import Residents from '../Components/Residents'
import Complaints from '../Components/Complaints'
import Amenities from '../Components/Amenities'
import Parking from '../Components/Parking'
import Staff from '../Components/Staff'
import Communication from '../Components/Communication'
import Documents from '../Components/Documents'
import Ecosystem from '../Components/Ecosystem'
import RoleExperience from '../Components/RoleExperience'
import HowItWorks from '../Components/HowItWorks'
import Communities from '../Components/Communities'
import WhySocietyOS from '../Components/WhySocietyOS'
import CTA from '../Components/CTA'
import Footer from '../Components/Footer'

export default function Home() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Features/>
      <Problem/>
      <Platform/>
      <Security/>
     <Billing/>
     <Finance/>
     <Residents/>
     <Complaints/>
     <Amenities/>
     <Parking/>
     <Staff/>
     <Communication/>
     <Documents/>
     <Ecosystem/>
     <RoleExperience/>
     <HowItWorks/>
     <Communities/>
     <WhySocietyOS/>
     <CTA/>
     <Footer/>
    </main>
  )
}