import { MessageCircle } from "lucide-react";
import { Button } from "./ui/button";

interface WhatsAppButtonProps {
  message?: string;
  className?: string;
}

const WhatsAppButton = ({ message = "Hi, I need help with PasarMalamAI", className }: WhatsAppButtonProps) => {
  const handleClick = () => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/60193438388?text=${encodedMessage}`, "_blank");
  };

  return (
    <Button 
      onClick={handleClick} 
      variant="outline" 
      className={className}
    >
      <MessageCircle className="w-4 h-4 mr-2" />
      WhatsApp Support
    </Button>
  );
};

export default WhatsAppButton;
