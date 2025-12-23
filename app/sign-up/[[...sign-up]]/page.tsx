import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gray-50 relative overflow-hidden flex items-center justify-center">
      {/* Dot pattern background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />

      {/* Floating accents - subtle light version */}
      <div className="absolute top-20 left-20 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
      <div className="absolute top-40 right-40 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl" />

      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 via-amber-400 to-blue-500 rounded-lg" />
            <span className="text-2xl font-semibold text-gray-900">Palette</span>
          </div>
          <p className="text-sm text-gray-500">Vos visuels de marque en 60 secondes</p>
        </div>

        {/* Clerk SignUp Component */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8">
          <SignUp
            appearance={{
              elements: {
                rootBox: 'mx-auto',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-gray-900 text-2xl font-semibold',
                headerSubtitle: 'text-gray-500 text-sm',
                socialButtonsBlockButton: 'border-gray-200 hover:bg-gray-50 text-gray-700',
                socialButtonsBlockButtonText: 'font-medium',
                formButtonPrimary: 'bg-gray-900 hover:bg-black text-white font-medium',
                formFieldInput: 'border-gray-200 focus:border-gray-400 text-gray-900',
                footerActionLink: 'text-gray-900 hover:text-black font-medium',
                identityPreviewText: 'text-gray-700',
                identityPreviewEditButton: 'text-gray-600',
                formFieldLabel: 'text-gray-700 font-medium',
                dividerLine: 'bg-gray-200',
                dividerText: 'text-gray-400',
                otpCodeFieldInput: 'border-gray-200 text-gray-900',
                formResendCodeLink: 'text-gray-900',
                alertText: 'text-sm',
              },
            }}
          />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-400 mt-6">
          En créant un compte, vous acceptez nos conditions d'utilisation
        </p>
      </div>
    </div>
  );
}
