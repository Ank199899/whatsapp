import React from 'react';
import './whatspro-logo.css';

interface WhatsProLogoProps {
  size?: number;
  className?: string;
  animated?: boolean;
}

export const WhatsProLogo: React.FC<WhatsProLogoProps> = ({ 
  size = 120, 
  className = '', 
  animated = true 
}) => {
  return (
    <div className={`whatspro-logo-container ${animated ? 'animated' : ''} ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="whatspro-logo-svg"
      >
        {/* Background Circle */}
        <circle
          cx="60"
          cy="60"
          r="55"
          fill="url(#backgroundGradient)"
          className="logo-background"
        />
        
        {/* WhatsApp-style Chat Bubble */}
        <path
          d="M30 45C30 35.0589 38.0589 27 48 27H72C81.9411 27 90 35.0589 90 45V65C90 74.9411 81.9411 83 72 83H55L42 93V83H48C38.0589 83 30 74.9411 30 65V45Z"
          fill="url(#chatGradient)"
          className="chat-bubble"
        />
        
        {/* Message Lines */}
        <line
          x1="42"
          y1="42"
          x2="78"
          y2="42"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          className="message-line line-1"
        />
        
        <line
          x1="42"
          y1="52"
          x2="68"
          y2="52"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          className="message-line line-2"
        />
        
        <line
          x1="42"
          y1="62"
          x2="72"
          y2="62"
          stroke="white"
          strokeWidth="3"
          strokeLinecap="round"
          className="message-line line-3"
        />
        
        {/* Pro Badge */}
        <circle
          cx="85"
          cy="35"
          r="12"
          fill="url(#proGradient)"
          className="pro-badge"
        />
        
        {/* Pro Text */}
        <text
          x="85"
          y="39"
          textAnchor="middle"
          fill="white"
          fontSize="8"
          fontWeight="bold"
          className="pro-text"
        >
          PRO
        </text>
        
        {/* Notification Dots */}
        <circle
          cx="95"
          cy="55"
          r="4"
          fill="#ff4757"
          className="notification-dot dot-1"
        />
        
        <circle
          cx="95"
          cy="68"
          r="3"
          fill="#ff6b7a"
          className="notification-dot dot-2"
        />
        
        {/* Connection Lines */}
        <path
          d="M20 20 Q30 15 40 25 T60 20"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          className="connection-line conn-1"
        />
        
        <path
          d="M100 100 Q90 105 80 95 T60 100"
          stroke="url(#connectionGradient)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          className="connection-line conn-2"
        />
        
        {/* Gradients */}
        <defs>
          <linearGradient id="backgroundGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#667eea" />
            <stop offset="100%" stopColor="#764ba2" />
          </linearGradient>
          
          <linearGradient id="chatGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25d366" />
            <stop offset="100%" stopColor="#128c7e" />
          </linearGradient>
          
          <linearGradient id="proGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="100%" stopColor="#ffb347" />
          </linearGradient>
          
          <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#74b9ff" />
            <stop offset="100%" stopColor="#0984e3" />
          </linearGradient>
        </defs>
      </svg>
      
      {/* Logo Text */}
      <div className="logo-text">
        <span className="whats-text">Whats</span>
        <span className="pro-text-main">Pro</span>
      </div>
    </div>
  );
};

export default WhatsProLogo;
