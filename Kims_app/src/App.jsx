import './App.css'
import Pages from "@/pages/index.jsx"
import { AuthProvider } from "@/context/AuthContext"
import { Toaster } from "@/components/ui/toaster"

function App() {
  return (
    <AuthProvider>
      <Pages />
      <Toaster />
    </AuthProvider>
  )
}

export default App 