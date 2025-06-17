
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Truck, Store, AlertCircle } from 'lucide-react';
import { useDeliveryEligibility } from '@/hooks/cart/useDeliveryEligibility';
import { useLanguage } from '@/hooks/useLanguage';

interface FulfillmentSelectorProps {
  selectedType: 'pickup' | 'delivery';
  onTypeChange: (type: 'pickup' | 'delivery') => void;
}

export function FulfillmentSelector({ selectedType, onTypeChange }: FulfillmentSelectorProps) {
  const { isDeliveryEligible, deliveryRulesSummary } = useDeliveryEligibility();
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          {t('fulfillment.title')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedType}
          onValueChange={(value) => onTypeChange(value as 'pickup' | 'delivery')}
          className="space-y-4"
        >
          {/* Pickup Option */}
          <div className="flex items-center space-x-3 p-4 border rounded-lg">
            <RadioGroupItem value="pickup" id="pickup" />
            <Label htmlFor="pickup" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-3">
                <Store className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium">{t('fulfillment.pickup.title')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('fulfillment.pickup.description')}
                  </div>
                </div>
              </div>
            </Label>
          </div>

          {/* Delivery Option */}
          <div className={`flex items-center space-x-3 p-4 border rounded-lg ${
            !isDeliveryEligible ? 'opacity-50 bg-muted' : ''
          }`}>
            <RadioGroupItem 
              value="delivery" 
              id="delivery" 
              disabled={!isDeliveryEligible}
            />
            <Label 
              htmlFor="delivery" 
              className={`flex-1 ${!isDeliveryEligible ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center gap-3">
                <Truck className="w-5 h-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">{t('fulfillment.delivery.title')}</div>
                  <div className="text-sm text-muted-foreground">
                    {t('fulfillment.delivery.description')}
                  </div>
                  {!isDeliveryEligible && (
                    <Badge variant="secondary" className="mt-1">
                      {t('fulfillment.delivery.notEligible')}
                    </Badge>
                  )}
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>

        {/* Delivery Requirements */}
        {!isDeliveryEligible && deliveryRulesSummary.length > 0 && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-amber-800 mb-1">
                  Delivery Requirements
                </div>
                <div className="text-amber-700">
                  To enable delivery, your cart must contain:
                </div>
                <ul className="mt-1 space-y-1 text-amber-700">
                  {deliveryRulesSummary.map((rule, index) => (
                    <li key={index}>
                      • At least {rule.minimum_items} items from {rule.category?.name || 'Unknown Category'}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
