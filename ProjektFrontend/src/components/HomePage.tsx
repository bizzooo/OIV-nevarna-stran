import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { VulnerableTab } from "./VulnerableTab";
import { SecureTab } from "./SecureTab";

interface User {
  id: number;
  email: string;
  token?: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (!storedUser) {
      navigate("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="container mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-white text-3xl">OWASP Vulnerability Demo</h1>
          <div className="flex items-center gap-4">
            {user && <p className="text-gray-400">Logged in as: {user.email}</p>}
            <button
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <Tabs defaultValue="vulnerable" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="vulnerable" className="text-lg py-3">Vulnerable</TabsTrigger>
              <TabsTrigger value="secure" className="text-lg py-3">Secure</TabsTrigger>
            </TabsList>
            <TabsContent value="vulnerable">
              <VulnerableTab />
            </TabsContent>
            <TabsContent value="secure">
              <SecureTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}