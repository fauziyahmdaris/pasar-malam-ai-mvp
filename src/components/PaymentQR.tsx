import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import WhatsAppButton from "./WhatsAppButton";

interface PaymentQRProps {
  orderId: string;
  amount: number;
  onPaymentComplete: () => void;
  onCancel: () => void;
}

const PaymentQR = ({ orderId, amount, onPaymentComplete, onCancel }: PaymentQRProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"grabpay" | "tng">("grabpay");
  const [uploadedReceipt, setUploadedReceipt] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // For MVP, we're using a static QR code for each payment method
  const getQRImageSrc = () => {
    return paymentMethod === "grabpay" 
      ? "/assets/payment-qr-grabpay.png" 
      : "/assets/payment-qr-tng.png";
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedReceipt(e.target.files[0]);
    }
  };

  const handleSubmitPayment = async () => {
    if (!uploadedReceipt) {
      toast.error("Please upload your payment receipt");
      return;
    }

    setIsUploading(true);
    try {
      // For MVP, we'll simulate the upload and verification process
      // In production, this would upload to storage and update the order status
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success("Payment receipt uploaded successfully");
      onPaymentComplete();
    } catch (error) {
      console.error("Payment upload error:", error);
      toast.error("Failed to upload payment receipt");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Complete Your Payment</CardTitle>
        <CardDescription>
          Total Amount: RM {amount.toFixed(2)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="grabpay" onValueChange={(value) => setPaymentMethod(value as "grabpay" | "tng")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="grabpay">GrabPay</TabsTrigger>
            <TabsTrigger value="tng">Touch 'n Go</TabsTrigger>
          </TabsList>
          
          <TabsContent value="grabpay" className="space-y-4">
            <div className="bg-white p-4 rounded-lg flex justify-center">
              <img 
                src={getQRImageSrc()} 
                alt="GrabPay QR Code" 
                className="max-w-[200px] max-h-[200px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>1. Open your GrabPay app</p>
              <p>2. Scan this QR code</p>
              <p>3. Enter amount: RM {amount.toFixed(2)}</p>
              <p>4. Complete payment and upload receipt below</p>
            </div>
          </TabsContent>
          
          <TabsContent value="tng" className="space-y-4">
            <div className="bg-white p-4 rounded-lg flex justify-center">
              <img 
                src={getQRImageSrc()} 
                alt="Touch 'n Go QR Code" 
                className="max-w-[200px] max-h-[200px]"
              />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>1. Open your Touch 'n Go eWallet app</p>
              <p>2. Scan this QR code</p>
              <p>3. Enter amount: RM {amount.toFixed(2)}</p>
              <p>4. Complete payment and upload receipt below</p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-6 space-y-4">
          <div className="border-t pt-4">
            <p className="text-sm font-medium mb-2">Upload Payment Receipt</p>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-white
                hover:file:bg-primary/90"
            />
            {uploadedReceipt && (
              <p className="text-xs text-green-600 mt-1">
                ✓ {uploadedReceipt.name} selected
              </p>
            )}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col space-y-2">
        <Button 
          onClick={handleSubmitPayment} 
          className="w-full" 
          disabled={!uploadedReceipt || isUploading}
        >
          {isUploading ? "Processing..." : "Confirm Payment"}
        </Button>
        <Button 
          variant="outline" 
          onClick={onCancel}
          className="w-full"
        >
          Cancel
        </Button>
        <div className="w-full mt-2">
          <WhatsAppButton 
            message={`Hi, I need help with my payment for order #${orderId}`}
            className="w-full text-xs"
          />
        </div>
      </CardFooter>
    </Card>
  );
};

export default PaymentQR;