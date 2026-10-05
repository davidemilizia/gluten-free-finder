import Link from "next/link";

export default function ForgotPasswordLink() {
  return (
    <p style={{ marginTop: 10 }}>
      <Link href="/forgot-password">Hai dimenticato la password?</Link>
    </p>
  );
}
