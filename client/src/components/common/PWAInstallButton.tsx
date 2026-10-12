import React from 'react';
import { Download, Smartphone } from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { PWAInstallModal } from './PWAInstallModal';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'compact',
}) => {
  const {
    canInstall,
    isIOS,
    showIOSInstructions,
    setShowIOSInstructions,
    installApp,
    dismissInstall,
  } = usePWA();

  if (!canInstall) return null;

  return (
    <>
      <button
        onClick={installApp}
        title="Install FinFlow as a desktop or mobile application"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer border ${
          variant === 'full'
            ? 'w-full justify-center bg-purple-50 text-purple-950 border-purple-200 hover:bg-purple-100 hover:border-purple-300'
            : 'bg-white text-[#8B1A1A] border-[#8B1A1A]/30 hover:bg-[#8B1A1A]/5 hover:border-[#8B1A1A]'
        } ${className}`}
      >
        <Smartphone className="h-3.5 w-3.5 text-[#8B1A1A] stroke-[2.2]" />
        <span>Install App</span>
      </button>

      {/* iOS Instructions Modal */}
      {isIOS && (
        <PWAInstallModal
          isOpen={showIOSInstructions}
          onClose={() => setShowIOSInstructions(false)}
          onDismissForever={dismissInstall}
        />
      )}
    </>
  );
};

export default PWAInstallButton;
