import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import StallMap from "@/components/StallMap";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MarketMap = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/customer/browse-products")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Products
          </Button>
        </div>

        <Card className="p-4 h-[calc(100vh-120px)]">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold">Pasar Malam Taiping - Stall Map</h1>
          </div>
          <p className="text-muted-foreground mb-4">
            Find your favorite stalls at Pasar Malam Batu 2 1/2, Taiping, Perak. Click on a marker to see stall details.
          </p>
          <div className="h-[calc(100vh-240px)] w-full rounded-md overflow-hidden">
            <StallMap fullScreen={true} />
          </div>
        </Card>
      </div>
    </div>
  );
};

export default MarketMap;