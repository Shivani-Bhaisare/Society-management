import Navbar from '../Components/Navbar'
import Hero from '../Components/Hero'
import Features from '../Components/Features'
import Problem from '../Components/Problem'
import Platform from '../Components/Platform'
import Security from '../Components/Security'
import Billing from '../Components/Billing'
import Finance from '../Components/Finance'
import Residents from '../Components/Residents'

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
    </main>
  )
}