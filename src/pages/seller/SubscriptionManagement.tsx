import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { CheckCircle, Star, Crown } from 'lucide-react';

const SubscriptionManagement: React.FC = () => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);

  const plans = [
    {
      id: 'perintis',
      name: 'Peniaga Perintis',
      price: 30,
      duration: '3 months',
      description: 'Perfect for new sellers starting their journey',
      features: [
        'Basic product listing',
        'Standard order management',
        'Customer support',
        'Mobile app access'
      ],
      popular: false,
      icon: Star
    },
    {
      id: 'raya',
      name: 'Peniaga Raya',
      price: 249,
      duration: '5 months',
      description: 'Premium package for Kuih Raya sellers',
      features: [
        'All Perintis features',
        'Bulk order management',
        'Custom product bundles',
        'Lead time management',
        'Priority support',
        'Advanced analytics',
        'Raya marketing tools'
      ],
      popular: true,
      icon: Crown
    }
  ];

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleSubscribe = (planId: string) => {
    // Redirect to payment page
    window.location.href = `/seller/subscription-payment?plan=${planId}`;
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose Your Plan</h1>
        <p className="text-muted-foreground">
          Select the perfect plan for your business needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {plans.map((plan) => {
          const Icon = plan.icon;
          return (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Most Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Icon className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="space-y-1">
                  <div className="text-3xl font-bold">RM {plan.price}</div>
                  <div className="text-sm text-muted-foreground">{plan.duration}</div>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id)}
                  >
                    {plan.id === 'perintis' ? 'Start Free Trial' : 'Get Raya Package'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Plan Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Feature</th>
                  <th className="text-center p-2">Peniaga Perintis</th>
                  <th className="text-center p-2">Peniaga Raya</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-2">Product Listing</td>
                  <td className="text-center p-2">✓</td>
                  <td className="text-center p-2">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Order Management</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Advanced</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Bulk Order Management</td>
                  <td className="text-center p-2">✗</td>
                  <td className="text-center p-2">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Custom Bundles</td>
                  <td className="text-center p-2">✗</td>
                  <td className="text-center p-2">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Lead Time Management</td>
                  <td className="text-center p-2">✗</td>
                  <td className="text-center p-2">✓</td>
                </tr>
                <tr className="border-b">
                  <td className="p-2">Support</td>
                  <td className="text-center p-2">Standard</td>
                  <td className="text-center p-2">Priority</td>
                </tr>
                <tr>
                  <td className="p-2">Analytics</td>
                  <td className="text-center p-2">Basic</td>
                  <td className="text-center p-2">Advanced</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Why Choose Peniaga Raya?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Perfect for Kuih Raya Season</h4>
              <p className="text-sm text-muted-foreground">
                Specialized features designed for the high-demand Raya period with bulk orders and custom bundles.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">5-Month Coverage</h4>
              <p className="text-sm text-muted-foreground">
                Covers the entire Raya season from January to May 2026, giving you maximum value.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Priority Support</h4>
              <p className="text-sm text-muted-foreground">
                Get dedicated support during the busy Raya period to ensure smooth operations.
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Advanced Analytics</h4>
              <p className="text-sm text-muted-foreground">
                Track your Raya sales performance and optimize your business strategy.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionManagement;
