import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Loader2, Mail, Chrome } from "lucide-react";

export default function Login() {
  const [isLogging, setIsLogging] = useState(false);

  const handleGoogleLogin = async () => {
    setIsLogging(true);
    // Redirect to Google OAuth
    window.location.href = "/api/auth/google";
  };

  const handleDemoLogin = async () => {
    setIsLogging(true);
    // Direct admin login for immediate access
    window.location.href = "/api/admin/login";
  };

  const handleQuickDemo = async () => {
    setIsLogging(true);
    // Demo user login
    window.location.href = "/api/demo/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              SendWo Pro
            </CardTitle>
            <p className="text-blue-600 mt-2 text-lg">Welcome back!</p>
            <p className="text-gray-500 text-sm">Sign in to your WhatsApp Marketing Dashboard</p>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Google Sign In Button */}
          <Button
            onClick={handleGoogleLogin}
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 text-lg shadow-sm hover:shadow-md transition-all duration-200"
            disabled={isLogging}
            variant="outline"
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                Continue with Google
              </>
            )}
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">Or</span>
            </div>
          </div>

          {/* Admin Dashboard Login */}
          <Button
            onClick={handleDemoLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLogging}
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <Mail className="w-5 h-5 mr-3" />
                Admin Dashboard
              </>
            )}
          </Button>

          {/* Quick Demo Login */}
          <Button
            onClick={handleQuickDemo}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLogging}
            variant="outline"
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Signing in...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-3" />
                Quick Demo
              </>
            )}
          </Button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>New to SendWo Pro? <a href="/signup" className="text-green-600 font-medium hover:underline">Create an account</a></p>
            <div className="pt-4 border-t border-gray-200">
              <a href="/landing" className="text-green-600 hover:text-green-700 underline transition-colors">
                ← Back to Marketing Page
              </a>
            </div>
          </div>

          {/* Features Preview */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-gray-800 mb-2">What you'll get:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Bulk WhatsApp messaging</li>
              <li>• Real-time chat management</li>
              <li>• AI-powered responses</li>
              <li>• Campaign analytics</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}