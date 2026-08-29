import React from 'react';

interface AlertToastProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'advisory' | 'critical';
}

export const AlertToast: React.FC<AlertToastProps> = ({
  visible,
  onClose,
  title,
  message,
  type = 'advisory',
}) => {
  if (!visible) return null;

  const isCritical = type === 'critical';

  return (
    <div className="fixed top-20 right-6 z-50 alert-slide max-w-sm w-full">
      <div
        className={`bg-surface-elevated rounded shadow-lg p-4 flex items-start gap-3 border border-outline-variant ${
          isCritical
            ? 'border-l-4 border-l-error shadow-[0_4px_16px_rgba(186,26,26,0.15)]'
            : 'border-l-4 border-l-tertiary shadow-[0_4px_16px_rgba(81,95,116,0.15)]'
        }`}
      >
        <span
          className={`material-symbols-outlined mt-0.5 ${
            isCritical ? 'text-error animate-pulse' : 'text-tertiary'
          }`}
        >
          {isCritical ? 'warning' : 'warning'}
        </span>
        <div className="flex-1">
          <div className="font-headline-md text-[16px] text-on-surface mb-1 font-bold">
            {title}
          </div>
          <div className="font-body-base text-body-base text-on-surface-variant">
            {message}
          </div>
        </div>
        <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface">
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>
  );
};
