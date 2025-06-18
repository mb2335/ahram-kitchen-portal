
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Store, AlertCircle } from 'lucide-react';
import { useEnhancedDeliveryEligibility } from '@/hooks/cart/useEnhancedDeliveryEligibility';
import { useLanguage } from '@/hooks/useLanguage';

interface FulfillmentSelectorProps {
  selectedType: 'pickup' | 'delivery';
  onTypeChange: (type: 'pickup' | 'delivery') => void;
}

export function FulfillmentSelector({ selectedType, onTypeChange }: FulfillmentSelectorProps) {
  const { isDeliveryEligible, deliveryRulesSummary } = useEnhancedDeliveryEligibility();
  const { t } = useLanguage();

  console.log('[FulfillmentSelector] Delivery eligibility check:', {
    isDeliveryEligible,
    deliveryRulesSummary: deliveryRulesSummary.length,
    selectedType
  });

  return (
    <Card className="shadow-sm border-gray-200">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-gray-800">
          <div className="p-2 bg-white rounded-lg shadow-sm">
            <Truck className="w-6 h-6 text-blue-600" />
          </div>
          {t('fulfillment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => onTypeChange(value as 'pickup' | 'delivery')}
          className="space-y-4"
        >
          {/* Pickup Option */}
          <div className={`flex items-center space-x-4 p-4 border-2 rounded-xl transition-all duration-200 hover:shadow-md ${
            selectedType === 'pickup' 
              ? 'border-blue-500 bg-blue-50 shadow-sm' 
              : 'border-gray-200 hover:border-blue-300'
          }`}>
            <RadioGroupItem 
              value="pickup" 
              id="pickup" 
              className="border-2 w-5 h-5"
            />
            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  selectedType === 'pickup' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Store className={`w-6 h-6 ${
                    selectedType === 'pickup' ? 'text-blue-600' : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800">
                    {t('fulfillment.pickup.title')}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('fulfillment.pickup.description')}
                  </div>
                </div>
              </div>
            </Label>
          </div>

          {/* Delivery Option */}
          <div className={`flex items-center space-x-4 p-4 border-2 rounded-xl transition-all duration-200 ${
            !isDeliveryEligible 
              ? 'opacity-60 bg-gray-50 border-gray-200 cursor-not-allowed' 
              : selectedType === 'delivery'
                ? 'border-green-500 bg-green-50 shadow-sm hover:shadow-md'
                : 'border-gray-200 hover:border-green-300 hover:shadow-md'
          }`}>
            <RadioGroupItem 
              value="delivery" 
              id="delivery" 
              disabled={!isDeliveryEligible}
              className="border-2 w-5 h-5"
            />
            <Label 
              htmlFor="delivery" 
              className={`flex-1 ${!isDeliveryEligible ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-lg ${
                  !isDeliveryEligible 
                    ? 'bg-gray-100' 
                    : selectedType === 'delivery' 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                }`}>
                  <Truck className={`w-6 h-6 ${
                    !isDeliveryEligible 
                      ? 'text-gray-400' 
                      : selectedType === 'delivery' 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-lg text-gray-800 flex items-center gap-2">
                    {t('fulfillment.delivery.title')}
                    {!isDeliveryEligible && (
                      <Badge variant="secondary" className="text-xs">
                        {t('fulfillment.delivery.notEligible')}
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {t('fulfillment.delivery.description')}
                  </div>
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Delivery Requirements */}
        {!isDeliveryEligible && deliveryRulesSummary.length > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-2">
                  Delivery Requirements Not Met
                </div>
                <div className="text-amber-700 mb-2">
                  To enable delivery, your cart must contain:
                </div>
                <ul className="space-y-1 text-amber-700">
                  {deliveryRulesSummary.map((rule, index) => (
                    <li key={rule.id} className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 bg-amber-600 rounded-full"></div>
                      At least {rule.minimum_items} items from {rule.category?.name || 'Unknown Category'}
                      {index < deliveryRulesSummary.length - 1 && <span className="text-amber-600 font-medium ml-2">OR</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Debug info for testing */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
            <strong>Debug:</strong> Delivery Eligible: {isDeliveryEligible ? 'Yes' : 'No'}, 
            Rules: {deliveryRulesSummary.length}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
