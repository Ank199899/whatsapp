import React from 'react';

interface MessageStatusIndicatorProps {
  status: 'sent' | 'delivered' | 'read';
  className?: string;
}

export const MessageStatusIndicator: React.FC<MessageStatusIndicatorProps> = ({
  status,
  className = ''
}) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'sent':
        return (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            className={`inline-block ${className}`}
            fill="currentColor"
          >
            {/* Single tick for sent */}
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
        );

      case 'delivered':
        return (
          <svg
            width="18"
            height="14"
            viewBox="0 0 24 24"
            className={`inline-block ${className}`}
            fill="currentColor"
          >
            {/* Double tick for delivered - gray */}
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
          </svg>
        );

      case 'read':
        return (
          <svg
            width="18"
            height="14"
            viewBox="0 0 24 24"
            className={`inline-block ${className}`}
            fill="#22c55e"
          >
            {/* Double tick for read - green */}
            <path d="M18 7l-1.41-1.41-6.34 6.34 1.41 1.41L18 7zm4.24-1.41L11.66 16.17 7.48 12l-1.41 1.41L11.66 19l12-12-1.42-1.41zM.41 13.41L6 19l1.41-1.41L1.83 12 .41 13.41z"/>
          </svg>
        );

      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return 'text-gray-400';
      case 'delivered':
        return 'text-gray-500';
      case 'read':
        return 'text-green-500'; // Green for read status
      default:
        return 'text-gray-400';
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'sent':
        return 'Sent';
      case 'delivered':
        return 'Delivered';
      case 'read':
        return 'Read';
      default:
        return 'Sent';
    }
  };

  return (
    <span
      className={`text-xs ${getStatusColor()} ${className} transition-colors duration-200`}
      title={getStatusTitle()}
    >
      {getStatusIcon()}
    </span>
  );
};

export default MessageStatusIndicator;
