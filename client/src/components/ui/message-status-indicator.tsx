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
            width="12"
            height="12"
            viewBox="0 0 12 12"
            className={`inline-block ${className}`}
            fill="currentColor"
          >
            {/* Single tick for sent */}
            <path d="M9.707 3.293a1 1 0 0 1 0 1.414L5.414 9a1 1 0 0 1-1.414 0L1.293 6.293a1 1 0 1 1 1.414-1.414L4.707 6.879 8.293 3.293a1 1 0 0 1 1.414 0z"/>
          </svg>
        );

      case 'delivered':
        return (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            className={`inline-block ${className}`}
            fill="currentColor"
          >
            {/* Double tick for delivered - gray */}
            <path d="M11.707 1.293a1 1 0 0 1 0 1.414L7.414 7a1 1 0 0 1-1.414 0L3.293 4.293a1 1 0 1 1 1.414-1.414L6.707 4.879l3.586-3.586a1 1 0 0 1 1.414 0z"/>
            <path d="M15.707 1.293a1 1 0 0 1 0 1.414L11.414 7a1 1 0 0 1-1.414 0l-.5-.5a1 1 0 1 1 1.414-1.414l.293.293 3.586-3.586a1 1 0 0 1 1.414 0z"/>
          </svg>
        );

      case 'read':
        return (
          <svg
            width="16"
            height="12"
            viewBox="0 0 16 12"
            className={`inline-block ${className}`}
            fill="#3B82F6"
          >
            {/* Double tick for read - blue */}
            <path d="M11.707 1.293a1 1 0 0 1 0 1.414L7.414 7a1 1 0 0 1-1.414 0L3.293 4.293a1 1 0 1 1 1.414-1.414L6.707 4.879l3.586-3.586a1 1 0 0 1 1.414 0z"/>
            <path d="M15.707 1.293a1 1 0 0 1 0 1.414L11.414 7a1 1 0 0 1-1.414 0l-.5-.5a1 1 0 1 1 1.414-1.414l.293.293 3.586-3.586a1 1 0 0 1 1.414 0z"/>
          </svg>
        );

      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'sent':
        return 'text-blue-400';
      case 'delivered':
        return 'text-blue-500';
      case 'read':
        return ''; // Color is handled in the SVG for read status
      default:
        return 'text-blue-400';
    }
  };

  return (
    <span className={`text-xs ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
    </span>
  );
};

export default MessageStatusIndicator;
