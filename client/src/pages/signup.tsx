import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { MessageCircle, Loader2, Chrome, ArrowLeft, CheckCircle } from "lucide-react";

export default function Signup() {
  const [isLogging, setIsLogging] = useState(false);

  const handleGoogleSignup = async () => {
    setIsLogging(true);
    // Redirect to Google OAuth (same as login, Google will handle new users)
    window.location.href = "/api/auth/google";
  };

  const handleAdminLogin = async () => {
    setIsLogging(true);
    // Direct admin login for immediate access
    window.location.href = "/api/admin/login";
  };

  const handleDemoSignup = async () => {
    setIsLogging(true);
    // Demo user signup
    window.location.href = "/api/demo/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <MessageCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              Join SendWo Pro
            </CardTitle>
            <p className="text-gray-600 mt-2 text-lg">Start your journey!</p>
            <p className="text-gray-500 text-sm">Create your WhatsApp Marketing account</p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Google Sign Up Button */}
          <Button 
            onClick={handleGoogleSignup} 
            className="w-full bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 text-lg shadow-sm hover:shadow-md transition-all duration-200"
            disabled={isLogging}
            variant="outline"
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <Chrome className="w-5 h-5 mr-3 text-blue-500" />
                Sign up with Google
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

          {/* Admin Dashboard Access */}
          <Button
            onClick={handleAdminLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLogging}
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Accessing dashboard...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5 mr-3" />
                Access Admin Dashboard
              </>
            )}
          </Button>

          {/* Demo Signup for Development */}
          <Button
            onClick={handleDemoSignup}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg shadow-lg hover:shadow-xl transition-all duration-200"
            disabled={isLogging}
            variant="outline"
          >
            {isLogging ? (
              <>
                <Loader2 className="w-5 h-5 mr-3 animate-spin" />
                Creating account...
              </>
            ) : (
              <>
                <MessageCircle className="w-5 h-5 mr-3" />
                Try Demo Account
              </>
            )}
          </Button>

          <div className="text-center text-sm text-gray-500 space-y-2">
            <p>Already have an account? <a href="/login" className="text-green-600 font-medium hover:underline">Sign in here</a></p>
            <div className="pt-4 border-t border-gray-200">
              <a href="/landing" className="text-green-600 hover:text-green-700 underline transition-colors inline-flex items-center">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Back to Marketing Page
              </a>
            </div>
          </div>

          {/* Benefits Preview */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-lg p-4 mt-6">
            <h4 className="font-semibold text-gray-800 mb-3">🚀 What's included:</h4>
            <ul className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Unlimited WhatsApp messaging
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Real-time chat management
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                AI-powered auto responses
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Advanced campaign analytics
              </li>
              <li className="flex items-center">
                <CheckCircle className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                Multi-number support
              </li>
            </ul>
          </div>

          {/* Terms */}
          <div className="text-xs text-gray-400 text-center">
            By signing up, you agree to our{" "}
            <a href="#" className="text-green-600 hover:underline">Terms of Service</a>{" "}
            and{" "}
            <a href="#" className="text-green-600 hover:underline">Privacy Policy</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
