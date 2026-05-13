import { SignUp } from '@clerk/nextjs';

export default function SignUpPage() {
  return (
    <div className="h-screen flex items-center justify-center" style={{ background: '#F4F4F8' }}>
      <SignUp />
    </div>
  );
}
