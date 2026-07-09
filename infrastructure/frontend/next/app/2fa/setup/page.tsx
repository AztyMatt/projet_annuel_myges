import { Suspense } from "react";
import TwoFactorSetupPage from "./TwoFactorSetupContent";

export default function TwoFactorSetupPageWrapper() {
    return (
        <Suspense
            fallback={
                <div
                    className="min-h-screen flex items-center justify-center px-4"
                    style={{ background: "linear-gradient(135deg, #001944 0%, #002C6E 55%, #1d4ed8 100%)" }}
                >
                    <p className="text-white text-sm">Chargement…</p>
                </div>
            }
        >
            <TwoFactorSetupPage />
        </Suspense>
    );
}
