import React from 'react';
import { cn } from '@/lib/utils';

interface CuteAvatarProps {
  name?: string;
  phone?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showAnimation?: boolean;
}

export const CuteAvatar: React.FC<CuteAvatarProps> = ({
  name = '',
  phone = '',
  size = 'md',
  className = '',
  showAnimation = true
}) => {
  // Smart AI-based gender detection function
  const detectGender = (name: string) => {
    if (!name) return Math.random() > 0.5 ? 'female' : 'male';
    
    const cleanName = name.toLowerCase().trim();
    
    // Comprehensive Indian female names database
    const femaleNames = [
      'priya', 'sita', 'radha', 'kavya', 'anjali', 'pooja', 'neha', 'shreya', 'divya', 'riya',
      'anita', 'sunita', 'geeta', 'meera', 'seema', 'reema', 'deepika', 'kiran', 'suman', 'asha',
      'usha', 'maya', 'nisha', 'ritu', 'shanti', 'lakshmi', 'saraswati', 'parvati', 'durga',
      'kalpana', 'vandana', 'archana', 'rachana', 'swati', 'bharti', 'shakti', 'kriti', 'aditi',
      'smriti', 'preeti', 'jyoti', 'moti', 'shobha', 'rekha', 'lata', 'mamta', 'savita', 'kavita',
      'sangita', 'nita', 'rita', 'gita', 'sushma', 'pushpa', 'kamala', 'vimala', 'nirmala',
      'sharmila', 'urmila', 'leela', 'sheela', 'heera', 'veera', 'meena', 'rena', 'lena',
      'tina', 'nina', 'mina', 'dina', 'hina', 'rina', 'bina', 'gina', 'shweta', 'swetha',
      'sneha', 'neha', 'reha', 'komal', 'kamal', 'vimal', 'nimal', 'bimal', 'himal',
      'payal', 'kajal', 'anjal', 'sonal', 'monal', 'toral', 'hiral', 'kiral', 'viral',
      'devi', 'shree', 'sri', 'kumari', 'bai', 'mata', 'rani', 'princess', 'queen'
    ];
    
    // Comprehensive Indian male names database
    const maleNames = [
      'raj', 'ram', 'krishna', 'arjun', 'vikram', 'rahul', 'rohit', 'amit', 'sumit', 'ajit',
      'ravi', 'kavi', 'devi', 'shiv', 'dev', 'hari', 'giri', 'puri', 'nath', 'das',
      'kumar', 'chandra', 'surya', 'aditya', 'ankit', 'ankur', 'akash', 'aakash', 'vikas',
      'prakash', 'subhash', 'avinash', 'dinesh', 'ganesh', 'mahesh', 'naresh', 'suresh',
      'ramesh', 'umesh', 'yogesh', 'mukesh', 'rakesh', 'lokesh', 'hitesh', 'nitesh',
      'ritesh', 'mitesh', 'kailash', 'anil', 'sunil', 'kapil', 'sahil', 'nikhil', 'akhil',
      'vishal', 'kushal', 'himanshu', 'amanshu', 'anshu', 'rishabh', 'saurabh', 'gaurav',
      'keshav', 'madhav', 'raghav', 'arnav', 'pranav', 'manav', 'tanav', 'vaibhav',
      'abhishek', 'vivek', 'bibek', 'deepak', 'ashok', 'alok', 'vinod', 'pramod', 'manoj',
      'arun', 'tarun', 'varun', 'kiran', 'gagan', 'chetan', 'ratan', 'nutan', 'milan',
      'king', 'prince', 'raja', 'maharaja', 'sir', 'master', 'bhai', 'ji'
    ];
    
    // Check for exact matches first
    if (femaleNames.some(fname => cleanName.includes(fname))) return 'female';
    if (maleNames.some(mname => cleanName.includes(mname))) return 'male';
    
    // Check for common endings
    const femaleEndings = ['a', 'i', 'ya', 'ka', 'la', 'ma', 'na', 'ra', 'ta', 'va', 'sha', 'tha'];
    const maleEndings = ['an', 'ar', 'at', 'av', 'ay', 'en', 'er', 'et', 'in', 'it', 'on', 'or', 'ot', 'un', 'ur', 'ut'];
    
    if (femaleEndings.some(ending => cleanName.endsWith(ending))) return 'female';
    if (maleEndings.some(ending => cleanName.endsWith(ending))) return 'male';
    
    // Default to random if uncertain
    return Math.random() > 0.5 ? 'female' : 'male';
  };

  // Size configurations
  const sizeConfig = {
    sm: { container: 'w-8 h-8', avatar: 'w-6 h-6', face: 'w-4 h-4', hair: 'w-8 h-5' },
    md: { container: 'w-12 h-12', avatar: 'w-10 h-10', face: 'w-6 h-6', hair: 'w-12 h-7' },
    lg: { container: 'w-16 h-16', avatar: 'w-14 h-14', face: 'w-8 h-8', hair: 'w-16 h-10' },
    xl: { container: 'w-20 h-20', avatar: 'w-18 h-18', face: 'w-10 h-10', hair: 'w-20 h-12' }
  };

  const config = sizeConfig[size];
  const gender = detectGender(name);
  const isStableRandom = phone ? parseInt(phone.slice(-2)) % 2 === 0 : Math.random() > 0.5;

  if (gender === 'female') {
    return (
      <div className={cn(
        "relative flex items-center justify-center",
        config.container,
        showAnimation && "cute-avatar-bounce",
        className
      )}>
        {/* Female Cute Avatar */}
        <div className={cn(
          "rounded-full bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center shadow-lg",
          config.container
        )}>
          <div className={cn(
            "rounded-full bg-gradient-to-br from-pink-100 to-pink-200 relative shadow-inner",
            config.avatar
          )}>
            {/* Hair with cute style */}
            <div className={cn(
              "absolute bg-gradient-to-br from-amber-500 to-amber-600 rounded-t-full shadow-sm",
              config.hair,
              size === 'sm' ? '-top-1 -left-1' : size === 'md' ? '-top-1.5 -left-1.5' : '-top-2 -left-2'
            )}>
              {/* Hair highlights */}
              <div className={cn(
                "absolute bg-gradient-to-br from-amber-400 to-amber-500 rounded-t-full opacity-70",
                size === 'sm' ? 'w-6 h-4 top-0.5 left-0.5' : 
                size === 'md' ? 'w-9 h-5 top-0.5 left-0.5' : 
                'w-12 h-7 top-1 left-1'
              )}></div>
              
              {/* Cute hair accessories */}
              <div className={cn(
                "absolute bg-gradient-to-r from-pink-400 to-pink-500 rounded-full animate-pulse",
                size === 'sm' ? 'w-1 h-1 top-1 right-1' : 
                size === 'md' ? 'w-1.5 h-1.5 top-1 right-1' : 
                'w-2 h-2 top-2 right-2'
              )}></div>
            </div>
            
            {/* Cute face */}
            <div className={cn(
              "absolute bg-gradient-to-br from-orange-100 to-peach-200 rounded-full shadow-inner",
              config.face,
              size === 'sm' ? 'top-1.5 left-1.5' : size === 'md' ? 'top-2 left-2' : 'top-3 left-3'
            )}>
              {/* Cute eyes with sparkles */}
              <div className={cn(
                "absolute bg-gradient-to-br from-brown-800 to-black rounded-full shadow-sm",
                showAnimation && "cute-eye-blink",
                size === 'sm' ? 'w-1 h-1 top-1 left-0.5' : 
                size === 'md' ? 'w-1.5 h-1.5 top-1.5 left-1' : 
                'w-2 h-2 top-2 left-1.5'
              )}>
                <div className={cn(
                  "absolute bg-white rounded-full opacity-90",
                  size === 'sm' ? 'w-0.5 h-0.5 top-0 left-0' : 'w-0.5 h-0.5 top-0.5 left-0.5'
                )}></div>
              </div>
              
              <div className={cn(
                "absolute bg-gradient-to-br from-brown-800 to-black rounded-full shadow-sm",
                showAnimation && "cute-eye-blink",
                size === 'sm' ? 'w-1 h-1 top-1 right-0.5' : 
                size === 'md' ? 'w-1.5 h-1.5 top-1.5 right-1' : 
                'w-2 h-2 top-2 right-1.5'
              )}>
                <div className={cn(
                  "absolute bg-white rounded-full opacity-90",
                  size === 'sm' ? 'w-0.5 h-0.5 top-0 right-0' : 'w-0.5 h-0.5 top-0.5 right-0.5'
                )}></div>
              </div>
              
              {/* Cute nose */}
              <div className={cn(
                "absolute bg-pink-300 rounded-full",
                size === 'sm' ? 'w-0.5 h-0.5 top-1.5 left-1.5' : 
                size === 'md' ? 'w-1 h-1 top-2.5 left-2.5' : 
                'w-1.5 h-1.5 top-3.5 left-3.5'
              )}></div>
              
              {/* Cute smile */}
              <div className={cn(
                "absolute bg-gradient-to-r from-red-400 to-pink-400 rounded-full shadow-sm",
                size === 'sm' ? 'w-1.5 h-0.5 bottom-0.5 left-1' : 
                size === 'md' ? 'w-2 h-1 bottom-1 left-2' : 
                'w-3 h-1.5 bottom-1.5 left-3'
              )}></div>
              
              {/* Cute blush */}
              <div className={cn(
                "absolute bg-pink-300 rounded-full opacity-60",
                size === 'sm' ? 'w-0.5 h-0.5 top-1.5 left-0' : 
                size === 'md' ? 'w-1 h-1 top-2 left-0' : 
                'w-1.5 h-1.5 top-3 left-0'
              )}></div>
              <div className={cn(
                "absolute bg-pink-300 rounded-full opacity-60",
                size === 'sm' ? 'w-0.5 h-0.5 top-1.5 right-0' : 
                size === 'md' ? 'w-1 h-1 top-2 right-0' : 
                'w-1.5 h-1.5 top-3 right-0'
              )}></div>
            </div>
            
            {/* Cute earrings */}
            <div className={cn(
              "absolute bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-sm",
              showAnimation && "cute-earring-swing",
              size === 'sm' ? 'w-0.5 h-0.5 top-2.5 -left-0.5' : 
              size === 'md' ? 'w-1 h-1 top-3.5 -left-0.5' : 
              'w-1.5 h-1.5 top-5 -left-1'
            )}></div>
            <div className={cn(
              "absolute bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full shadow-sm",
              showAnimation && "cute-earring-swing",
              size === 'sm' ? 'w-0.5 h-0.5 top-2.5 -right-0.5' : 
              size === 'md' ? 'w-1 h-1 top-3.5 -right-0.5' : 
              'w-1.5 h-1.5 top-5 -right-1'
            )}></div>
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className={cn(
        "relative flex items-center justify-center",
        config.container,
        showAnimation && "cute-avatar-bounce",
        className
      )}>
        {/* Male Cute Avatar */}
        <div className={cn(
          "rounded-full bg-gradient-to-br from-blue-200 to-indigo-300 flex items-center justify-center shadow-lg",
          config.container
        )}>
          <div className={cn(
            "rounded-full bg-gradient-to-br from-blue-100 to-blue-200 relative shadow-inner",
            config.avatar
          )}>
            {/* Hair with cute style */}
            <div className={cn(
              "absolute bg-gradient-to-br from-gray-600 to-gray-700 rounded-t-full shadow-sm",
              config.hair,
              size === 'sm' ? '-top-1 -left-1' : size === 'md' ? '-top-1.5 -left-1.5' : '-top-2 -left-2'
            )}>
              {/* Hair highlights */}
              <div className={cn(
                "absolute bg-gradient-to-br from-gray-500 to-gray-600 rounded-t-full opacity-70",
                size === 'sm' ? 'w-6 h-3 top-0.5 left-0.5' : 
                size === 'md' ? 'w-9 h-4 top-0.5 left-0.5' : 
                'w-12 h-6 top-1 left-1'
              )}></div>
            </div>
            
            {/* Cute face */}
            <div className={cn(
              "absolute bg-gradient-to-br from-orange-100 to-peach-200 rounded-full shadow-inner",
              config.face,
              size === 'sm' ? 'top-1.5 left-1.5' : size === 'md' ? 'top-2 left-2' : 'top-3 left-3'
            )}>
              {/* Cute eyes with sparkles */}
              <div className={cn(
                "absolute bg-gradient-to-br from-brown-800 to-black rounded-full shadow-sm",
                showAnimation && "cute-eye-blink",
                size === 'sm' ? 'w-1 h-1 top-1 left-0.5' : 
                size === 'md' ? 'w-1.5 h-1.5 top-1.5 left-1' : 
                'w-2 h-2 top-2 left-1.5'
              )}>
                <div className={cn(
                  "absolute bg-white rounded-full opacity-90",
                  size === 'sm' ? 'w-0.5 h-0.5 top-0 left-0' : 'w-0.5 h-0.5 top-0.5 left-0.5'
                )}></div>
              </div>
              
              <div className={cn(
                "absolute bg-gradient-to-br from-brown-800 to-black rounded-full shadow-sm",
                showAnimation && "cute-eye-blink",
                size === 'sm' ? 'w-1 h-1 top-1 right-0.5' : 
                size === 'md' ? 'w-1.5 h-1.5 top-1.5 right-1' : 
                'w-2 h-2 top-2 right-1.5'
              )}>
                <div className={cn(
                  "absolute bg-white rounded-full opacity-90",
                  size === 'sm' ? 'w-0.5 h-0.5 top-0 right-0' : 'w-0.5 h-0.5 top-0.5 right-0.5'
                )}></div>
              </div>
              
              {/* Eyebrows */}
              <div className={cn(
                "absolute bg-gray-700 rounded-full",
                size === 'sm' ? 'w-1 h-0.5 top-0.5 left-0.5' : 
                size === 'md' ? 'w-1.5 h-0.5 top-1 left-1' : 
                'w-2 h-1 top-1.5 left-1.5'
              )}></div>
              <div className={cn(
                "absolute bg-gray-700 rounded-full",
                size === 'sm' ? 'w-1 h-0.5 top-0.5 right-0.5' : 
                size === 'md' ? 'w-1.5 h-0.5 top-1 right-1' : 
                'w-2 h-1 top-1.5 right-1.5'
              )}></div>
              
              {/* Cute nose */}
              <div className={cn(
                "absolute bg-orange-300 rounded-full",
                size === 'sm' ? 'w-0.5 h-0.5 top-1.5 left-1.5' : 
                size === 'md' ? 'w-1 h-1 top-2.5 left-2.5' : 
                'w-1.5 h-1.5 top-3.5 left-3.5'
              )}></div>
              
              {/* Cute smile */}
              <div className={cn(
                "absolute bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-sm",
                size === 'sm' ? 'w-1.5 h-0.5 bottom-0.5 left-1' : 
                size === 'md' ? 'w-2 h-0.5 bottom-1 left-2' : 
                'w-3 h-1 bottom-1.5 left-3'
              )}></div>
              
              {/* Optional facial hair */}
              {isStableRandom && (
                <div className={cn(
                  "absolute bg-gray-600 rounded-b-full opacity-70",
                  size === 'sm' ? 'w-2 h-0.5 bottom-0 left-1' : 
                  size === 'md' ? 'w-3 h-1 bottom-0 left-1.5' : 
                  'w-4 h-1.5 bottom-0 left-2'
                )}></div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default CuteAvatar;
