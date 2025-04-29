
import React from 'react';
import { Github, Mail, Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  return (
    <footer className={cn("w-full py-6 px-4 glass border-t", className)}>
      <div className="container mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Pulse</h3>
            <p className="text-sm text-muted-foreground">
              Stay informed with personalized news that matters to you.
            </p>
            <div className="flex space-x-3">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Github className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full">
                <Mail className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Categories</h3>
            <ul className="space-y-1">
              <li><a href="/explore" className="text-sm hover:underline">Technology</a></li>
              <li><a href="/explore" className="text-sm hover:underline">Science</a></li>
              <li><a href="/explore" className="text-sm hover:underline">Business</a></li>
              <li><a href="/explore" className="text-sm hover:underline">Entertainment</a></li>
              <li><a href="/explore" className="text-sm hover:underline">Sports</a></li>
            </ul>
          </div>
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Resources</h3>
            <ul className="space-y-1">
              <li><a href="/help" className="text-sm hover:underline">Help Center</a></li>
              <li><a href="/privacy" className="text-sm hover:underline">Privacy Policy</a></li>
              <li><a href="/terms" className="text-sm hover:underline">Terms of Service</a></li>
              <li><a href="/contact" className="text-sm hover:underline">Contact Us</a></li>
            </ul>
          </div>
        </div>
        
        <Separator className="my-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Pulse News. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center mt-2 md:mt-0">
            Made with <Heart className="h-4 w-4 mx-1 text-red-500" /> for passionate readers
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
