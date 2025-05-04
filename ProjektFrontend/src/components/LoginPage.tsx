import { useNavigate } from "react-router-dom";
import { LoginForm } from "./login-form";
import { useEffect } from "react";

export function LoginPage() {
  const navigate = useNavigate();
  
  useEffect(()=>{
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/home");
    }
  },[navigate]);


  return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <LoginForm />
    </div>
  )
}