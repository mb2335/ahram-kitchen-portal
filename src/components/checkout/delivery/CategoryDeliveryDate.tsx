
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

interface Category {
  id: string;
  name: string;
  name_ko: string;
  fulfillment_types: string[] | null;
}

interface CategoryDeliveryDateProps {
  category: Category;
  selectedFulfillmentType: string;
  onFulfillmentTypeChange: (type: string) => void;
  isDisabled?: boolean;
}

export function CategoryDeliveryDate({
  category,
  selectedFulfillmentType,
  onFulfillmentTypeChange,
  isDisabled = false
}: CategoryDeliveryDateProps) {
  const { t, language } = useLanguage();
  const categoryName = language === 'en' ? category.name : category.name_ko || category.name;
  const availableTypes = category.fulfillment_types || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>{categoryName}</Label>
        <RadioGroup 
          value={selectedFulfillmentType} 
          onValueChange={onFulfillmentTypeChange}
          className="flex flex-col space-y-2"
          disabled={isDisabled || availableTypes.length === 1}
        >
          {availableTypes.map(type => (
            <div key={type} className="flex items-center space-x-2">
              <RadioGroupItem 
                value={type} 
                id={`${type}-${category.id}`}
                disabled={isDisabled || availableTypes.length === 1}
              />
              <Label 
                htmlFor={`${type}-${category.id}`}
                className={availableTypes.length === 1 ? "text-gray-500" : ""}
              >
                {t(`checkout.fulfillment.${type.toLowerCase()}`)}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>
    </div>
  );
}
